<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\CustomerController;

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'app' => 'AGS ERP',
        'version' => '1.0.0'
    ]);
});

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    return response()->json([
        'customers' => DB::table('customers')->count(),
        'products'  => 0,
        'vendors'   => 0,
        'sales'     => 0
    ]);
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| Customer Management
|--------------------------------------------------------------------------
*/

Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{customer}', [CustomerController::class, 'show']);
Route::put('/customers/{customer}', [CustomerController::class, 'update']);
Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);