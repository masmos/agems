<?php

namespace App\Console\Commands;

use App\Services\AlertEngineService;
use Illuminate\Console\Command;

class CheckEnvironmentalThresholds extends Command
{
    protected $signature = 'environmental:check-thresholds {--once : Run once and exit}';
    
    protected $description = 'Check environmental readings against thresholds and generate alerts';
    
    public function handle(AlertEngineService $alertEngine): int
    {
        $this->info('Starting environmental threshold check...');
        $startTime = microtime(true);
        
        try {
            $results = $alertEngine->checkAllThresholds();
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->info("\n✓ Alert check completed in {$duration}ms");
            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("Monitoring Stations Checked: {$results['monitoring_stations']}");
            $this->info("Flare Sites Checked: {$results['flare_sites']}");
            $this->info("Alerts Generated: {$results['alerts_generated']}");
            
            if (!empty($results['errors'])) {
                $this->error("\nErrors encountered:");
                foreach ($results['errors'] as $error) {
                    $this->error("  • {$error}");
                }
                return 1;
            }
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("Fatal error: " . $e->getMessage());
            return 1;
        }
    }
}
