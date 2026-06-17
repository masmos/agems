<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Moses Masaba',
                'email' => 'mmasaba085@gmail.com',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Adriko Grace Gatete',
                'email' => 'gatetegrace@gmail.com',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Kigozi Jonah',
                'email' => 'kigozijonah4@gmail.com',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Musinguzi Joseph',
                'email' => 'musinguzijoseph19@gmail.com',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Alema Fredrick',
                'email' => 'alemafredrick@gmail.com',
                'password' => Hash::make('password'),
            ]
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }

        $this->command->info('Users seeded successfully!');
    }
}
