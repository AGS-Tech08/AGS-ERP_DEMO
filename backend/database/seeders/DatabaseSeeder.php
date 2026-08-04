<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@agserp.com'],
            [
                'name' => 'AGS ERP Admin',
                'password' => Hash::make('Admin@123'),
            ]
        );
    }
}