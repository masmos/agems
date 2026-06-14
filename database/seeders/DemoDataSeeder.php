<?php

namespace Database\Seeders;

use App\Models\FlareEmission;
use App\Models\FlareSite;
use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create monitoring stations
        $stations = [
            [
                'station_name' => 'Buliisa AQI Station',
                'location' => 'Buliisa District',
                'latitude' => 1.8467,
                'longitude' => 31.4167,
                'status' => 'active',
            ],
            [
                'station_name' => 'Hoima Environmental Hub',
                'location' => 'Hoima City',
                'latitude' => 1.4333,
                'longitude' => 31.3500,
                'status' => 'active',
            ],
        ];
        
        foreach ($stations as $stationData) {
            $station = MonitoringStation::create($stationData);
            
            // Create sample telemetry readings
            TelemetryReading::create([
                'monitoring_station_id' => $station->id,
                'reading_datetime' => now(),
                'aqi' => 85,
                'pm2_5' => 28,
                'pm10' => 45,
                'methane' => 8,
                'co2' => 750,
                'temperature' => 26.5,
            ]);
        }
        
        // Create flare sites
        $flares = [
            [
                'site_name' => 'Kingfisher Flare Site A',
                'location' => 'Kikuube District',
                'latitude' => 1.0167,
                'longitude' => 31.1167,
                'status' => 'active',
            ],
            [
                'site_name' => 'Tilenga Flare Site B',
                'location' => 'Nwoya District',
                'latitude' => 2.3833,
                'longitude' => 32.0000,
                'status' => 'active',
            ],
        ];
        
        foreach ($flares as $flareData) {
            $flare = FlareSite::create($flareData);
            
            // Create sample emissions
            FlareEmission::create([
                'flare_site_id' => $flare->id,
                'reading_datetime' => now(),
                'methane_level' => 450,
                'co2_level' => 4800,
                'so2_level' => 90,
                'nox_level' => 140,
            ]);
        }
        
        $this->command->info('Demo data created successfully!');
    }
}
