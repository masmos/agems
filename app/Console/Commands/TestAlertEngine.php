<?php

namespace App\Console\Commands;

use App\Models\Alert;
use App\Models\FlareEmission;
use App\Models\FlareSite;
use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use App\Services\AlertEngineService;
use Illuminate\Console\Command;

class TestAlertEngine extends Command
{
    protected $signature = 'environmental:test-alerts
                            {--station= : Test specific station by ID}
                            {--flare= : Test specific flare site by ID}';
    
    protected $description = 'Test the alert engine with sample data';
    
    protected $alertEngine;
    
    public function __construct(AlertEngineService $alertEngine)
    {
        parent::__construct();
        $this->alertEngine = $alertEngine;
    }
    
    public function handle(): int
    {
        $this->info('🧪 Testing Alert Engine');
        $this->newLine();
        
        if ($this->option('station')) {
            $this->testStation((int)$this->option('station'));
        } elseif ($this->option('flare')) {
            $this->testFlareSite((int)$this->option('flare'));
        } else {
            $this->testAllActiveSites();
        }
        
        $this->newLine();
        $this->info('✅ Alert engine test completed');
        
        return 0;
    }
    
    protected function testStation(int $stationId): void
    {
        $station = MonitoringStation::find($stationId);
        
        if (!$station) {
            $this->error("Station ID {$stationId} not found");
            return;
        }
        
        $this->info("Testing station: {$station->station_name}");
        
        // Clear old alerts for this station to ensure fresh notifications
        Alert::where('source_type', 'App\\Models\\MonitoringStation')
            ->where('source_id', $stationId)
            ->delete();
        $this->info("  ✓ Cleared previous alerts");
        
        // Create test readings that breach thresholds
        $testReadings = [
            ['aqi' => 160, 'pm2_5' => 60, 'pm10' => 110, 'methane' => 25, 'co2' => 1200],
            ['aqi' => 120, 'pm2_5' => 40, 'pm10' => 70, 'methane' => 15, 'co2' => 900],
        ];
        
        foreach ($testReadings as $index => $values) {
            TelemetryReading::create([
                'monitoring_station_id' => $station->id,
                'reading_datetime' => now(),
                'aqi' => $values['aqi'],
                'pm2_5' => $values['pm2_5'],
                'pm10' => $values['pm10'],
                'methane' => $values['methane'],
                'co2' => $values['co2'],
                'temperature' => 25.5,
            ]);
            
            $this->info("  ✓ Created test reading #" . ($index + 1) . " (AQI: {$values['aqi']})");
        }
        
        // Manually trigger the alert check by calling the service directly
        $this->newLine();
        $this->info("Running alert checks...");
        $results = $this->alertEngine->checkAllThresholds();
        
        $this->info("  ✓ Monitoring stations checked: {$results['monitoring_stations']}");
        $this->info("  ✓ Alerts generated: {$results['alerts_generated']}");
        
        if (!empty($results['errors'])) {
            $this->error("  ✗ Errors: " . implode(', ', $results['errors']));
        }
    }
    
    protected function testFlareSite(int $siteId): void
    {
        $site = FlareSite::find($siteId);
        
        if (!$site) {
            $this->error("Flare site ID {$siteId} not found");
            return;
        }
        
        $this->info("Testing flare site: {$site->site_name}");
        
        // Clear old alerts for this flare site to ensure fresh notifications
        Alert::where('source_type', 'App\\Models\\FlareSite')
            ->where('source_id', $siteId)
            ->delete();
        $this->info("  ✓ Cleared previous alerts");
        
        // Create test emissions that breach thresholds
        $testEmissions = [
            ['methane_level' => 1200, 'so2_level' => 250, 'nox_level' => 350, 'co2_level' => 12000],
            ['methane_level' => 800, 'so2_level' => 150, 'nox_level' => 200, 'co2_level' => 8000],
        ];
        
        foreach ($testEmissions as $index => $values) {
            FlareEmission::create([
                'flare_site_id' => $site->id,
                'reading_datetime' => now(),
                'methane_level' => $values['methane_level'],
                'co2_level' => $values['co2_level'],
                'so2_level' => $values['so2_level'],
                'nox_level' => $values['nox_level'],
            ]);
            
            $this->info("  ✓ Created test emission #" . ($index + 1) . " (Methane: {$values['methane_level']} ppm)");
        }
        
        // Manually trigger the alert check by calling the service directly
        $this->newLine();
        $this->info("Running alert checks...");
        $results = $this->alertEngine->checkAllThresholds();
        
        $this->info("  ✓ Flare sites checked: {$results['flare_sites']}");
        $this->info("  ✓ Alerts generated: {$results['alerts_generated']}");
        
        if (!empty($results['errors'])) {
            $this->error("  ✗ Errors: " . implode(', ', $results['errors']));
        }
    }
    
    protected function testAllActiveSites(): void
    {
        $stations = MonitoringStation::where('status', 'active')->get();
        $flares = FlareSite::where('status', 'active')->get();
        
        if ($stations->isEmpty() && $flares->isEmpty()) {
            $this->warn('No active stations or flare sites found.');
            $this->info("\nTip: Run database seeders first:");
            $this->info("  php artisan db:seed --class=DemoDataSeeder");
            return;
        }
        
        foreach ($stations as $station) {
            $this->testStation($station->id);
            $this->newLine();
        }
        
        foreach ($flares as $flare) {
            $this->testFlareSite($flare->id);
            $this->newLine();
        }
    }
}