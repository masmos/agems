<?php

namespace Database\Seeders;

use App\Models\Threshold;
use Illuminate\Database\Seeder;

class ThresholdsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         $thresholds = [
            // ========== MONITORING STATION THRESHOLDS ==========
            // AQI
            [
                'parameter' => 'aqi',
                'source_type' => 'monitoring_station',
                'max_value' => 100,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'aqi',
                'source_type' => 'monitoring_station',
                'max_value' => 150,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // PM2.5
            [
                'parameter' => 'pm2_5',
                'source_type' => 'monitoring_station',
                'max_value' => 35,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'pm2_5',
                'source_type' => 'monitoring_station',
                'max_value' => 55,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // PM10
            [
                'parameter' => 'pm10',
                'source_type' => 'monitoring_station',
                'max_value' => 50,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'pm10',
                'source_type' => 'monitoring_station',
                'max_value' => 100,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // Methane
            [
                'parameter' => 'methane',
                'source_type' => 'monitoring_station',
                'max_value' => 10,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'methane',
                'source_type' => 'monitoring_station',
                'max_value' => 20,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // CO2
            [
                'parameter' => 'co2',
                'source_type' => 'monitoring_station',
                'max_value' => 800,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'co2',
                'source_type' => 'monitoring_station',
                'max_value' => 1000,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // ========== FLARE SITE THRESHOLDS ==========
            // Methane Level
            [
                'parameter' => 'methane_level',
                'source_type' => 'flare_site',
                'max_value' => 500,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'methane_level',
                'source_type' => 'flare_site',
                'max_value' => 1000,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // SO2 Level
            [
                'parameter' => 'so2_level',
                'source_type' => 'flare_site',
                'max_value' => 100,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'so2_level',
                'source_type' => 'flare_site',
                'max_value' => 200,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // NOx Level
            [
                'parameter' => 'nox_level',
                'source_type' => 'flare_site',
                'max_value' => 150,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'nox_level',
                'source_type' => 'flare_site',
                'max_value' => 300,
                'severity' => 'critical',
                'is_active' => true,
            ],
            
            // CO2 Level
            [
                'parameter' => 'co2_level',
                'source_type' => 'flare_site',
                'max_value' => 5000,
                'severity' => 'warning',
                'is_active' => true,
            ],
            [
                'parameter' => 'co2_level',
                'source_type' => 'flare_site',
                'max_value' => 10000,
                'severity' => 'critical',
                'is_active' => true,
            ],
        ];

        foreach ($thresholds as $threshold) {
            Threshold::updateOrCreate(
                [
                    'parameter' => $threshold['parameter'],
                    'source_type' => $threshold['source_type'],
                    'severity' => $threshold['severity'],
                ],
                $threshold
            );
        }

        $this->command->info('✓ Thresholds seeded successfully!');
        $this->command->info('  - ' . count($thresholds) . ' thresholds created/updated');
        $this->command->info('  - Includes both warning and critical levels for each parameter');
    }
}
