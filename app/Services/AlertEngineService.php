<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\FlareSite;
use App\Models\MonitoringStation;
use App\Models\Threshold;
use App\Models\User;
use App\Notifications\ThresholdBreachedNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class AlertEngineService
{
      public function checkAllThresholds(): array
    {
        $results = [
            'monitoring_stations' => 0,
            'flare_sites' => 0,
            'alerts_generated' => 0,
            'notifications_sent' => 0,
            'errors' => [],
        ];

        try {
            $results['monitoring_stations'] = $this->checkMonitoringStations();
            $results['flare_sites'] = $this->checkFlareSites();
            $results['alerts_generated'] = $results['monitoring_stations'] + $results['flare_sites'];
            
            Log::info('Alert engine check completed', $results);
        } catch (\Exception $e) {
            Log::error('Alert engine failed: ' . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }
        
        return $results;
    }
    
    protected function checkMonitoringStations(): int
    {
        $alertsGenerated = 0;
        
        $thresholds = Threshold::active()
            ->where('source_type', 'monitoring_station')
            ->get()
            ->groupBy('parameter');
        
        if ($thresholds->isEmpty()) {
            return 0;
        }
        
        $stations = MonitoringStation::where('status', 'active')
            ->with('latestReading')
            ->get();
        
        foreach ($stations as $station) {
            $reading = $station->latestReading;
            if (!$reading) continue;
            
            $alertsGenerated += $this->checkReadingAgainstThresholds($station, $reading, $thresholds);
        }
        
        return $alertsGenerated;
    }
    
    protected function checkFlareSites(): int
    {
        $alertsGenerated = 0;
        
        $thresholds = Threshold::active()
            ->where('source_type', 'flare_site')
            ->get()
            ->groupBy('parameter');
        
        if ($thresholds->isEmpty()) {
            return 0;
        }
        
        $sites = FlareSite::where('status', 'active')
            ->with('latestEmission')
            ->get();
        
        foreach ($sites as $site) {
            $emission = $site->latestEmission;
            if (!$emission) continue;
            
            $alertsGenerated += $this->checkEmissionAgainstThresholds($site, $emission, $thresholds);
        }
        
        return $alertsGenerated;
    }
    
    protected function checkReadingAgainstThresholds($station, $reading, $thresholds): int
    {
        $alertsGenerated = 0;
        
        $parameters = [
            'aqi' => $reading->aqi,
            'pm2_5' => $reading->pm2_5,
            'pm10' => $reading->pm10,
            'methane' => $reading->methane,
            'co2' => $reading->co2,
        ];
        
        foreach ($parameters as $parameter => $value) {
            if ($value === null) continue;
            
            $parameterThresholds = $thresholds->get($parameter, collect());
            foreach ($parameterThresholds as $threshold) {
                if ($this->isThresholdBreached($threshold, $value)) {
                    $this->generateAlert($station, $threshold, $value, $parameter);
                    $alertsGenerated++;
                }
            }
        }
        
        return $alertsGenerated;
    }
    
    protected function checkEmissionAgainstThresholds($site, $emission, $thresholds): int
    {
        $alertsGenerated = 0;
        
        $parameters = [
            'methane_level' => $emission->methane_level,
            'co2_level' => $emission->co2_level,
            'so2_level' => $emission->so2_level,
            'nox_level' => $emission->nox_level,
        ];
        
        foreach ($parameters as $parameter => $value) {
            if ($value === null) continue;
            
            $parameterThresholds = $thresholds->get($parameter, collect());
            foreach ($parameterThresholds as $threshold) {
                if ($this->isThresholdBreached($threshold, $value)) {
                    $this->generateAlert($site, $threshold, $value, $parameter);
                    $alertsGenerated++;
                }
            }
        }
        
        return $alertsGenerated;
    }
    
    protected function isThresholdBreached(Threshold $threshold, float $value): bool
    {
        if ($threshold->min_value !== null && $value < $threshold->min_value) {
            return true;
        }
        
        if ($threshold->max_value !== null && $value > $threshold->max_value) {
            return true;
        }
        
        return false;
    }
    
    protected function generateAlert($source, Threshold $threshold, float $currentValue, string $parameterName): void
    {
        // Check for existing unacknowledged alert
        $existingAlert = Alert::where('source_type', get_class($source))
            ->where('source_id', $source->id)
            ->where('threshold_id', $threshold->id)
            ->where('acknowledged', false)
            ->where('created_at', '>=', now()->subHours(24))
            ->first();
        
        $alert = null;
        $isNewAlert = false;
        
        if ($existingAlert) {
            $existingAlert->update([
                'message' => $this->buildAlertMessage($source, $threshold, $currentValue, $parameterName),
                'updated_at' => now(),
            ]);
            $alert = $existingAlert;
            Log::info('Updated existing alert', ['alert_id' => $alert->id]);
        } else {
            $alert = Alert::create([
                'alert_type' => $this->determineAlertType($source),
                'source_type' => get_class($source),
                'source_id' => $source->id,
                'threshold_id' => $threshold->id,
                'severity' => $threshold->severity,
                'message' => $this->buildAlertMessage($source, $threshold, $currentValue, $parameterName),
                'acknowledged' => false,
            ]);
            $isNewAlert = true;
            Log::info('Created new alert', ['alert_id' => $alert->id]);
        }
        
        // Send notifications for new alerts
        if ($isNewAlert) {
            $this->sendAlertNotifications($alert, $source, $threshold, $currentValue, $parameterName);
        }
    }
    
    protected function sendAlertNotifications($alert, $source, Threshold $threshold, float $currentValue, string $parameterName): void
    {
        // Determine which users to notify
        $users = $this->getUsersToNotify($threshold->severity);
        
        Log::info('Attempting to send notifications', [
            'severity' => $threshold->severity,
            'users_found' => $users->count(),
            'users' => $users->pluck('email')->toArray()
        ]);
        
        if ($users->isEmpty()) {
            Log::warning('No users found to notify for alert', ['severity' => $threshold->severity]);
            return;
        }
        
        // Send notifications
        try {
            Notification::send($users, new ThresholdBreachedNotification(
                $alert,
                $source,
                $threshold,
                $currentValue,
                $parameterName
            ));
            
            Log::info('Notifications sent successfully', [
                'alert_id' => $alert->id,
                'recipients' => $users->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send notifications: ' . $e->getMessage());
        }
    }
    
    protected function getUsersToNotify(string $severity): \Illuminate\Support\Collection
    {
        if ($severity === 'critical') {
            return User::role(['Administrator', 'Compliance Officer'])->get();
        } else {
            return User::role(['Administrator', 'Environmental Officer'])->get();
        }
    }
    
    protected function determineAlertType($source): string
    {
        if ($source instanceof MonitoringStation) {
            return 'air_quality';
        }
        
        if ($source instanceof FlareSite) {
            return 'flare_emission';
        }
        
        return 'environmental';
    }
    
    protected function buildAlertMessage($source, Threshold $threshold, float $currentValue, string $parameterName): string
    {
        $sourceName = $source instanceof MonitoringStation ? $source->station_name : $source->site_name;
        $operator = $threshold->min_value !== null ? 'below' : 'above';
        $limit = $threshold->min_value ?? $threshold->max_value;
        $unit = $this->getUnitForParameter($parameterName);
        
        return sprintf(
            '[%s] %s at %s is %s %.2f%s (limit: %.2f%s)',
            strtoupper($threshold->severity),
            strtoupper($parameterName),
            $sourceName,
            $operator,
            $currentValue,
            $unit,
            $limit,
            $unit
        );
    }
    
    protected function getUnitForParameter(string $parameter): string
    {
        return match($parameter) {
            'aqi' => '',
            'pm2_5', 'pm10' => ' µg/m³',
            'methane', 'co2', 'co2_level', 'methane_level', 'so2_level', 'nox_level' => ' ppm',
            'temperature' => '°C',
            default => '',
        };
    }
}