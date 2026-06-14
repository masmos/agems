<?php

namespace Database\Seeders;

use Database\Seeders\ThresholdsTableSeeder;
use Database\Seeders\UsersTableSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
/*         User::factory()->create([
            'name' => 'Moses Masaba',
            'email' => 'mmasaba085@gmail.com',
            'password' => bcrypt('password'),
        ]); */

        $this->call([
            UsersTableSeeder::class,
            ThresholdsTableSeeder::class,
            DemoDataSeeder::class,
            RolesTableSeeder::class,
        ]);
    }
}
