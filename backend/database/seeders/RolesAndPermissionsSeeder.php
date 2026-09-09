<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [

            'dashboard.view',

            'customer.view',
            'customer.create',
            'customer.edit',
            'customer.delete',

            'product.view',
            'product.create',
            'product.edit',
            'product.delete',

            'vendor.view',
            'vendor.create',
            'vendor.edit',
            'vendor.delete',

            'quotation.view',
            'quotation.create',
            'quotation.edit',
            'quotation.approve',

            'project.view',
            'project.create',
            'project.edit',
            'project.assign',

            'service.view',
            'service.create',
            'service.edit',
            'service.close',

            'amc.view',
            'amc.create',
            'amc.edit',

            'reports.view',

            'settings.manage',

            'invoice-template.view',
            'invoice-template.manage',
            'invoice-template.set-default',
            'invoice-template.configure',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $roles = [
            'Super Admin',
            'Admin',
            'Sales',
            'Service',
            'Engineer',
            'Accounts',
            'Purchase',
            'Store',
            'Customer'
        ];

        foreach ($roles as $roleName) {

            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            if ($roleName == 'Super Admin') {
                $role->syncPermissions(Permission::all());
            }
        }
    }
}