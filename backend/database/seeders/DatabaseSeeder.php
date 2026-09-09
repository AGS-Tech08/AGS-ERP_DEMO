<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Roles & Permissions
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(InvoiceTemplateSeeder::class);

        // Create Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@ags.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Admin@123'),
            ]
        );

        // Assign Super Admin Role
        $admin->assignRole('Super Admin');
    }
}