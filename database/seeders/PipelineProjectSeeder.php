<?php

namespace Database\Seeders;

use App\Models\PipelineProject;
use Illuminate\Database\Seeder;

class PipelineProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            [
                'project_name' => 'East African Crude Oil Pipeline - Segment A',
                'description' => 'Construction of the first segment of the East African Crude Oil Pipeline (EACOP) spanning from Kabaale, Hoima to the Uganda-Tanzania border. This segment includes 144km of pipeline, 2 pumping stations, and associated infrastructure. Environmental impact assessments have been conducted with mitigation measures for wetland crossings and wildlife corridors.',
                'progress_percentage' => 78.5,
                'status' => 'in_progress',
                'start_date' => '2024-01-15',
                'end_date' => '2025-06-30',
                'location' => 'Kabaale, Hoima District',
                'latitude' => 1.4333,
                'longitude' => 31.3500,
                'contractor' => 'China Petroleum Pipeline Engineering Co., Ltd.',
                'budget' => 450000000.00,
                'actual_cost' => 320000000.00,
                'environmental_impact_score' => 65,
                'compliance_status' => 'partially_compliant',
                'notes' => 'Wetland crossing mitigation measures being implemented. Monthly environmental audits show good compliance with EMP. Community engagement ongoing.',
            ],
            [
                'project_name' => 'Tilenga Oil Fields Pipeline Network',
                'description' => 'Development of the pipeline network connecting the Tilenga oil fields to the central processing facility. This project includes 200km of gathering pipelines, flow lines, and associated infrastructure. The network traverses through multiple districts including Buliisa, Nwoya, and Kiryandongo.',
                'progress_percentage' => 92.3,
                'status' => 'in_progress',
                'start_date' => '2023-08-01',
                'end_date' => '2025-03-15',
                'location' => 'Tilenga Fields, Buliisa District',
                'latitude' => 2.1289,
                'longitude' => 31.4167,
                'contractor' => 'Saipem S.p.A.',
                'budget' => 320000000.00,
                'actual_cost' => 295000000.00,
                'environmental_impact_score' => 72,
                'compliance_status' => 'compliant',
                'notes' => 'Pipeline integrity testing completed. Flare emission monitoring shows compliance with NEMA standards. Wildlife corridors maintained.',
            ],
            [
                'project_name' => 'Kingfisher Development Area Pipeline',
                'description' => 'Construction of the pipeline infrastructure for the Kingfisher Development Area, including the main export pipeline, water injection lines, and gas lift systems. This project connects the Kingfisher field to the central processing facilities in Kabaale. Includes 85km of pipeline.',
                'progress_percentage' => 45.2,
                'status' => 'active',
                'start_date' => '2024-06-01',
                'end_date' => '2026-04-30',
                'location' => 'Kingfisher Field, Kikuube District',
                'latitude' => 1.4500,
                'longitude' => 31.2500,
                'contractor' => 'BOC Gases Nigeria Ltd',
                'budget' => 280000000.00,
                'actual_cost' => 110000000.00,
                'environmental_impact_score' => 58,
                'compliance_status' => 'compliant',
                'notes' => 'Early works completed. Main pipeline installation in progress. Environmental monitoring shows minimal impact. Community engagement program active.',
            ],
            [
                'project_name' => 'Lake Albert Basin Gas Pipeline Project',
                'description' => 'Development of a natural gas pipeline network to transport associated gas from oil production sites to the proposed gas-to-power plant. The project includes 120km of gas pipeline, compression stations, and metering facilities. This is a critical infrastructure project for Uganda\'s energy transition.',
                'progress_percentage' => 12.0,
                'status' => 'planning',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
                'location' => 'Lake Albert Basin Region',
                'latitude' => 1.9000,
                'longitude' => 31.5000,
                'contractor' => 'TotalEnergies EP Uganda',
                'budget' => 180000000.00,
                'actual_cost' => 15000000.00,
                'environmental_impact_score' => 45,
                'compliance_status' => 'not_assessed',
                'notes' => 'Feasibility studies completed. EIA underway. Stakeholder consultations ongoing. Design optimization in progress.',
            ],
            [
                'project_name' => 'Albertine Graben Water Supply Pipeline',
                'description' => 'Construction of a water supply pipeline to provide potable water to communities affected by oil and gas development activities. This project includes 65km of water pipeline, pumping stations, and storage tanks. It serves 25 villages across Hoima, Buliisa, and Kikuube districts.',
                'progress_percentage' => 100.0,
                'status' => 'completed',
                'start_date' => '2023-01-15',
                'end_date' => '2024-03-30',
                'location' => 'Hoima-Buliisa-Kikuube Region',
                'latitude' => 1.5500,
                'longitude' => 31.3800,
                'contractor' => 'Dott Services Ltd',
                'budget' => 85000000.00,
                'actual_cost' => 82000000.00,
                'environmental_impact_score' => 22,
                'compliance_status' => 'compliant',
                'notes' => 'Project completed on budget and ahead of schedule. Water testing shows compliance with WHO standards. Community satisfaction survey results positive. Handover completed to local government.',
            ],
        ];

        foreach ($projects as $project) {
            PipelineProject::create($project);
        }

        $this->command->info('✅ 5 Pipeline projects seeded successfully!');
        $this->command->info('   - Projects: East African Crude Oil Pipeline, Tilenga Oil Fields, Kingfisher Development Area, Lake Albert Basin Gas Pipeline, Albertine Graben Water Supply');
    }
}