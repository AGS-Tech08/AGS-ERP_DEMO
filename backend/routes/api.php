
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\VendorPaymentController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationTemplateController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\InvoiceNumberSettingController;
use App\Http\Controllers\InvoiceTemplateController;
use App\Http\Controllers\AmcController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceTemplateController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DailyWorkController;
use App\Http\Controllers\PerformanceController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [AuthController::class, 'profile']);


    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', function () {

        return response()->json([
            'success' => true,

            'data' => [

                'customers' =>
                    DB::table('customers')->count(),

                'products' =>
                    DB::table('products')->count(),

                'vendors' =>
                    DB::table('vendors')->count(),

                'purchases' =>
                    DB::table('purchases')->count(),

                'sales' =>
                    DB::table('sales')->count(),

            ],
        ]);

    });


    /*
    |--------------------------------------------------------------------------
    | Customers
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'customers',
        CustomerController::class
    );


    /*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

Route::post(
    '/products/import',
    [ProductController::class, 'import']
);

Route::apiResource(
    'products',
    ProductController::class
);
    /*
    |--------------------------------------------------------------------------
    | Vendors
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'vendors',
        VendorController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Purchases
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'purchases',
        PurchaseController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Vendor Payments
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'vendor-payments',
        VendorPaymentController::class
    )->only([
        'index',
        'store',
        'show',
        'destroy',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Company Profile
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/company-profile',
        [CompanyProfileController::class, 'show']
    );

    Route::put(
        '/company-profile',
        [CompanyProfileController::class, 'update']
    );

    Route::post(
        '/company-profile/logo',
        [CompanyProfileController::class, 'uploadLogo']
    );


    /*
    |--------------------------------------------------------------------------
    | Bank Accounts
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/bank-accounts/active',
        [BankAccountController::class, 'active']
    );

    Route::apiResource(
        'bank-accounts',
        BankAccountController::class
    )->except([
        'create',
        'edit',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Invoice Number Settings
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/invoice-number-settings',
        [InvoiceNumberSettingController::class, 'show']
    );

    Route::put(
        '/invoice-number-settings',
        [InvoiceNumberSettingController::class, 'update']
    );

    Route::get(
        '/invoice-number-settings/preview',
        [InvoiceNumberSettingController::class, 'preview']
    );


    /*
    |--------------------------------------------------------------------------
    | Invoice Templates
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/invoice-templates/default',
        [InvoiceTemplateController::class, 'default']
    );

    Route::get(
        '/invoice-templates/{invoiceTemplate}/preview',
        [InvoiceTemplateController::class, 'preview']
    );

    Route::put(
        '/invoice-templates/{invoiceTemplate}/config',
        [InvoiceTemplateController::class, 'updateConfig']
    );

    Route::post(
        '/invoice-templates/{invoiceTemplate}/set-default',
        [InvoiceTemplateController::class, 'setDefault']
    );

    Route::apiResource(
        'invoice-templates',
        InvoiceTemplateController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Sales
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'sales',
        SaleController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);

    Route::apiResource(
        'quotations',
        QuotationController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);

    Route::post(
        '/quotations/{quotation}/duplicate',
        [QuotationController::class, 'duplicate']
    );

    Route::put(
        '/quotations/{quotation}/status',
        [QuotationController::class, 'updateStatus']
    );

    Route::get(
        '/quotations/{quotation}/preview',
        [QuotationController::class, 'preview']
    );

    Route::post(
        '/quotations/{quotation}/convert-to-invoice',
        [QuotationController::class, 'convertToInvoice']
    );

    Route::get('/quotations/{quotation}/document', [DocumentController::class, 'quotation']);
    Route::apiResource('quotation-templates', QuotationTemplateController::class)->only(['index', 'store', 'update']);
    Route::put('/quotation-templates/{quotationTemplate}/config', [QuotationTemplateController::class, 'updateConfig']);
    Route::post('/quotation-templates/{quotationTemplate}/set-default', [QuotationTemplateController::class, 'setDefault']);


    /*
    |--------------------------------------------------------------------------
    | AMC Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'amcs',
        AmcController::class
    );

    Route::post(
        '/amcs/{amc}/attach-asset',
        [AmcController::class, 'attachAsset']
    );

    Route::delete(
        '/amcs/{amc}/detach-asset/{asset}',
        [AmcController::class, 'detachAsset']
    );

    Route::post(
        '/amcs/{amc}/service-records',
        [AmcController::class, 'addServiceRecord']
    );


    /*
    |--------------------------------------------------------------------------
    | Asset Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'assets',
        AssetController::class
    );

    Route::post(
        '/assets/{asset}/service-records',
        [AssetController::class, 'addServiceRecord']
    );


    /*
    |--------------------------------------------------------------------------
    | Rewards
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/reward-settings',
        [RewardController::class, 'settings']
    );

    Route::put(
        '/reward-settings',
        [RewardController::class, 'updateSettings']
    );

    Route::get(
        '/customers/{customer}/reward',
        [RewardController::class, 'getCustomerReward']
    );

    Route::get(
        '/customers/{customer}/reward-history',
        [RewardController::class, 'rewardHistory']
    );

    Route::get(
        '/reward-items',
        [RewardController::class, 'rewardItems']
    );

    Route::post(
        '/reward-items',
        [RewardController::class, 'storeRewardItem']
    );

    Route::put(
        '/reward-items/{rewardItem}',
        [RewardController::class, 'updateRewardItem']
    );

    Route::delete(
        '/reward-items/{rewardItem}',
        [RewardController::class, 'destroyRewardItem']
    );

    Route::post(
        '/reward-redeem',
        [RewardController::class, 'redeemReward']
    );

    Route::post(
        '/sales/{sale}/award-points',
        [RewardController::class, 'awardPointsForSale']
    );


    /*
    |--------------------------------------------------------------------------
    | Service Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'services',
        ServiceController::class
    );

    Route::post(
        '/services/{service}/change-status',
        [ServiceController::class, 'changeStatus']
    );

    Route::post(
        '/services/{service}/spares',
        [ServiceController::class, 'addSpare']
    );

    Route::put(
        '/services/{service}/spares/{spare}',
        [ServiceController::class, 'updateSpare']
    );

    Route::delete(
        '/services/{service}/spares/{spare}',
        [ServiceController::class, 'removeSpare']
    );

    Route::post(
        '/services/{service}/payment',
        [ServiceController::class, 'recordPayment']
    );

    Route::post(
        '/services/{service}/deliver',
        [ServiceController::class, 'deliver']
    );

    Route::get(
        '/services/{service}/status-history',
        [ServiceController::class, 'statusHistory']
    );

    Route::get('/services/{service}/document/{type}', [DocumentController::class, 'service']);
    Route::get('/service-templates', [ServiceTemplateController::class, 'index']);
    Route::post('/service-templates', [ServiceTemplateController::class, 'store']);
    Route::put('/service-templates/{serviceTemplate}/config', [ServiceTemplateController::class, 'updateConfig']);
    Route::post('/service-templates/{serviceTemplate}/set-default', [ServiceTemplateController::class, 'setDefault']);


    /*
    |--------------------------------------------------------------------------
    | Departments
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'departments',
        DepartmentController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Employees
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'employees',
        EmployeeController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);


    /*
    |--------------------------------------------------------------------------
    | Tasks
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'tasks',
        TaskController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);

    Route::post(
        '/tasks/{task}/assign',
        [TaskController::class, 'assign']
    );

    Route::put(
        '/tasks/{task}/assignments/{assignment}',
        [TaskController::class, 'updateAssignment']
    );


    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/attendances/check-in',
        [AttendanceController::class, 'checkIn']
    );

    Route::post(
        '/attendances/check-out',
        [AttendanceController::class, 'checkOut']
    );

    Route::apiResource(
        'attendances',
        AttendanceController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Daily Work
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'daily-works',
        DailyWorkController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Skills
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'skills',
        SkillController::class
    );

    Route::get(
        '/employees/{employee}/skills',
        [SkillController::class, 'employeeSkills']
    );

    Route::post(
        '/employees/{employee}/skills',
        [SkillController::class, 'assign']
    );

    Route::put(
        '/employees/{employee}/skills/{skill}',
        [SkillController::class, 'updateEmployeeSkill']
    );

    Route::patch(
        '/employees/{employee}/skills/{skill}',
        [SkillController::class, 'updateEmployeeSkill']
    );

    Route::delete(
        '/employees/{employee}/skills/{skill}',
        [SkillController::class, 'removeEmployeeSkill']
    );


    /*
    |--------------------------------------------------------------------------
    | Performance
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'performances',
        PerformanceController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    Route::prefix('reports')->group(function () {

        Route::get(
            '/employees',
            [ReportController::class, 'employees']
        );

        Route::get(
            '/attendance',
            [ReportController::class, 'attendance']
        );

        Route::get(
            '/tasks',
            [ReportController::class, 'tasks']
        );

        Route::get(
            '/task-completion',
            [ReportController::class, 'taskCompletion']
        );

        Route::get(
            '/daily-work',
            [ReportController::class, 'dailyWork']
        );

        Route::get(
            '/work-hours',
            [ReportController::class, 'workHours']
        );

        Route::get(
            '/productivity',
            [ReportController::class, 'productivity']
        );

        Route::get(
            '/skill-improvement',
            [ReportController::class, 'skillImprovement']
        );

        Route::get(
            '/performance',
            [ReportController::class, 'performance']
        );

        Route::get(
            '/sales-summary',
            [ReportController::class, 'salesSummary']
        );

        Route::get(
            '/outstanding',
            [ReportController::class, 'outstanding']
        );

        Route::get(
            '/purchase-summary',
            [ReportController::class, 'purchaseSummary']
        );

        Route::get(
            '/stock-summary',
            [ReportController::class, 'stockSummary']
        );

        Route::get(
            '/business',
            [ReportController::class, 'business']
        );

        Route::get(
            '/rewards',
            [ReportController::class, 'rewards']
        );

        Route::get(
            '/customers',
            [ReportController::class, 'customers']
        );

        Route::get(
            '/vendors',
            [ReportController::class, 'vendors']
        );

        Route::get(
            '/services',
            [ReportController::class, 'services']
        );

        Route::get(
            '/amcs',
            [ReportController::class, 'amcs']
        );

        Route::get(
            '/assets',
            [ReportController::class, 'assets']
        );

        Route::get(
            '/payments',
            [ReportController::class, 'payments']
        );

        Route::get(
            '/financial-summary',
            [ReportController::class, 'financialSummary']
        );

        Route::get('/gst/tax-invoices', [ReportController::class, 'gstTaxInvoices']);
    });

});