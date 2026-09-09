<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function dates(Request $request, string $column): array
    {
        return array_filter([
            'from' => $request->filled('date_from') ? [$column, '>=', $request->date('date_from')] : null,
            'to' => $request->filled('date_to') ? [$column, '<=', $request->date('date_to')] : null,
        ]);
    }

    private function applyDates($query, Request $request, string $column)
    {
        foreach ($this->dates($request, $column) as $where) $query->whereDate(...$where);
        return $query;
    }

    public function employees(Request $request)
    {
        $query = DB::table('employees')->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->leftJoin('users', 'users.id', '=', 'employees.user_id')
            ->select('employees.*', 'departments.name as department_name', 'users.name as user_name');
        if ($request->filled('employee_status')) $query->where('employees.employee_status', $request->string('employee_status'));
        if ($request->filled('department_id')) $query->where('employees.department_id', $request->integer('department_id'));
        if ($request->filled('search')) $query->where(function ($q) use ($request) { $term = '%' . $request->string('search') . '%'; $q->where('employees.employee_id', 'like', $term)->orWhere('users.name', 'like', $term)->orWhere('employees.designation', 'like', $term); });
        return response()->json(['success' => true, 'data' => $query->orderBy('employees.employee_id')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function attendance(Request $request)
    {
        $query = $this->applyDates(DB::table('attendances')->join('employees', 'employees.id', '=', 'attendances.employee_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('attendances.*', 'employees.employee_id as employee_code', 'users.name as employee_name'), $request, 'attendances.attendance_date');
        if ($request->filled('employee_id')) $query->where('attendances.employee_id', $request->integer('employee_id'));
        if ($request->filled('status')) $query->where('attendances.attendance_status', $request->string('status'));
        $rows = $query->orderByDesc('attendance_date')->paginate(min(max($request->integer('per_page', 25), 1), 100));
        $summary = DB::table('attendances')->select('attendance_status', DB::raw('COUNT(*) as total'))->groupBy('attendance_status')->pluck('total', 'attendance_status');
        return response()->json(['success' => true, 'data' => $rows, 'summary' => $summary]);
    }

    public function tasks(Request $request)
    {
        $query = DB::table('tasks')->leftJoin('task_assignments', 'task_assignments.task_id', '=', 'tasks.id')->select('tasks.*', DB::raw('COUNT(task_assignments.id) as assignment_count'))->groupBy('tasks.id');
        if ($request->filled('status')) $query->where('tasks.task_status', $request->string('status'));
        if ($request->filled('priority')) $query->where('tasks.priority', $request->string('priority'));
        if ($request->filled('employee_id')) $query->where('task_assignments.employee_id', $request->integer('employee_id'));
        $rows = $query->orderByDesc('tasks.due_date')->paginate(min(max($request->integer('per_page', 25), 1), 100));
        $summary = DB::table('tasks')->select('task_status', DB::raw('COUNT(*) as total'))->groupBy('task_status')->pluck('total', 'task_status');
        return response()->json(['success' => true, 'data' => $rows, 'summary' => $summary]);
    }

    public function taskCompletion(Request $request)
    {
        $query = DB::table('task_assignments')->join('tasks', 'tasks.id', '=', 'task_assignments.task_id')->join('employees', 'employees.id', '=', 'task_assignments.employee_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('employees.id', 'employees.employee_id as employee_code', 'users.name as employee_name', DB::raw('COUNT(task_assignments.id) as assigned_tasks'), DB::raw("SUM(task_assignments.assignment_status = 'Completed') as completed_tasks"), DB::raw('ROUND(100 * SUM(task_assignments.assignment_status = \'Completed\') / NULLIF(COUNT(task_assignments.id), 0), 2) as completion_rate'))->groupBy('employees.id', 'employees.employee_id', 'users.name');
        if ($request->filled('employee_id')) $query->where('employees.id', $request->integer('employee_id'));
        return response()->json(['success' => true, 'data' => $query->orderBy('employee_name')->get()]);
    }

    public function dailyWork(Request $request)
    {
        $query = $this->applyDates(DB::table('daily_works')->join('employees', 'employees.id', '=', 'daily_works.employee_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('daily_works.*', 'employees.employee_id as employee_code', 'users.name as employee_name'), $request, 'daily_works.work_date');
        if ($request->filled('employee_id')) $query->where('daily_works.employee_id', $request->integer('employee_id'));
        if ($request->filled('work_type')) $query->where('daily_works.work_type', $request->string('work_type'));
        if ($request->filled('status')) $query->where('daily_works.status', $request->string('status'));
        return response()->json(['success' => true, 'data' => $query->orderByDesc('work_date')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function workHours(Request $request)
    {
        $query = $this->applyDates(DB::table('daily_works')->join('employees', 'employees.id', '=', 'daily_works.employee_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('employees.id', 'employees.employee_id as employee_code', 'users.name as employee_name', DB::raw('SUM(daily_works.hours_spent) as total_hours'), DB::raw('COUNT(DISTINCT daily_works.work_date) as work_days'), DB::raw('ROUND(SUM(daily_works.hours_spent) / NULLIF(COUNT(DISTINCT daily_works.work_date), 0), 2) as average_daily_hours'))->groupBy('employees.id', 'employees.employee_id', 'users.name'), $request, 'daily_works.work_date');
        if ($request->filled('employee_id')) $query->where('employees.id', $request->integer('employee_id'));
        return response()->json(['success' => true, 'data' => $query->orderBy('employee_name')->get()]);
    }

    public function productivity(Request $request)
    {
        $employees = DB::table('employees')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('employees.id', 'employees.employee_id as employee_code', 'users.name as employee_name')->when($request->filled('employee_id'), fn ($q) => $q->where('employees.id', $request->integer('employee_id')))->get();
        $data = $employees->map(function ($employee) use ($request) {
            $assigned = DB::table('task_assignments')->where('employee_id', $employee->id)->count();
            $completed = DB::table('task_assignments')->where('employee_id', $employee->id)->where('assignment_status', 'Completed')->count();
            $hours = $this->applyDates(DB::table('daily_works')->where('employee_id', $employee->id), $request, 'work_date')->sum('hours_spent');
            $performance = DB::table('performances')->where('employee_id', $employee->id)->avg('overall_rating');
            $attendance = $this->applyDates(DB::table('attendances')->where('employee_id', $employee->id), $request, 'attendance_date');
            $present = (clone $attendance)->whereIn('attendance_status', ['Present', 'Late'])->count();
            $attendanceTotal = (clone $attendance)->count();
            return ['employee_id' => $employee->id, 'employee_code' => $employee->employee_code, 'employee_name' => $employee->employee_name, 'tasks_assigned' => $assigned, 'tasks_completed' => $completed, 'completion_rate' => $assigned ? round($completed * 100 / $assigned, 2) : 0, 'total_work_hours' => (float) $hours, 'average_performance_rating' => $performance !== null ? round((float) $performance, 2) : null, 'attendance_rate' => $attendanceTotal ? round($present * 100 / $attendanceTotal, 2) : null];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function skillImprovement(Request $request)
    {
        $query = DB::table('employee_skills')->join('employees', 'employees.id', '=', 'employee_skills.employee_id')->join('skills', 'skills.id', '=', 'employee_skills.skill_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('employees.employee_id as employee_code', 'users.name as employee_name', 'skills.skill_name', 'skills.category', 'employee_skills.current_level', 'employee_skills.target_level', 'employee_skills.progress_percentage', 'employee_skills.improvement_goal', 'employee_skills.review_date', 'employee_skills.status');
        if ($request->filled('employee_id')) $query->where('employee_skills.employee_id', $request->integer('employee_id'));
        if ($request->filled('status')) $query->where('employee_skills.status', $request->string('status'));
        return response()->json(['success' => true, 'data' => $query->orderBy('employee_name')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function performance(Request $request)
    {
        $query = $this->applyDates(DB::table('performances')->join('employees', 'employees.id', '=', 'performances.employee_id')->leftJoin('users', 'users.id', '=', 'employees.user_id')->select('performances.*', 'employees.employee_id as employee_code', 'users.name as employee_name'), $request, 'performances.review_date');
        if ($request->filled('employee_id')) $query->where('performances.employee_id', $request->integer('employee_id'));
        if ($request->filled('review_period')) $query->where('performances.review_period', 'like', '%' . $request->string('review_period') . '%');
        return response()->json(['success' => true, 'data' => $query->orderByDesc('review_date')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function salesSummary(Request $request)
    {
        $query = $this->applyDates(DB::table('sales')->whereNull('sales.deleted_at'), $request, 'sale_date');
        $summary = $query->selectRaw('COUNT(*) as total_sales, COALESCE(SUM(grand_total), 0) as total_amount, COALESCE(SUM((SELECT SUM(amount) FROM sale_payments WHERE sale_payments.sale_id = sales.id)), 0) as paid_amount')->first();
        $summary->outstanding_amount = (float) $summary->total_amount - (float) $summary->paid_amount;
        $summary->avg_invoice_value = $summary->total_sales ? round((float) $summary->total_amount / $summary->total_sales, 2) : 0;
        return response()->json(['success' => true, 'data' => $summary]);
    }

    public function outstanding(Request $request)
    {
        $query = $this->applyDates(DB::table('sales')->join('customers', 'customers.id', '=', 'sales.customer_id')->whereNull('sales.deleted_at')->select('sales.invoice_no', 'customers.company_name as customer_name', 'sales.sale_date', 'sales.grand_total', DB::raw('(sales.grand_total - COALESCE((SELECT SUM(amount) FROM sale_payments WHERE sale_payments.sale_id = sales.id), 0)) as outstanding_amount')), $request, 'sales.sale_date')->having('outstanding_amount', '>', 0);
        return response()->json(['success' => true, 'data' => $query->orderByDesc('sale_date')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function purchaseSummary(Request $request)
    {
        $summary = $this->applyDates(DB::table('purchases')->whereNull('purchases.deleted_at'), $request, 'purchase_date')->selectRaw('COUNT(*) as total_purchases, COALESCE(SUM(grand_total), 0) as total_amount, COALESCE(SUM(paid_amount), 0) as paid_amount, COALESCE(SUM(balance_amount), 0) as outstanding_amount')->first();
        return response()->json(['success' => true, 'data' => $summary]);
    }

    public function stockSummary(Request $request)
    {
        $query = DB::table('products')->whereNull('products.deleted_at')->select('id', 'product_code', 'product_name', 'current_stock', 'minimum_stock', 'purchase_price', DB::raw('(current_stock * purchase_price) as stock_value'), DB::raw("CASE WHEN current_stock <= minimum_stock THEN 'Low' ELSE 'Adequate' END as stock_status"));
        if ($request->filled('search')) $query->where('product_name', 'like', '%' . $request->string('search') . '%');
        return response()->json(['success' => true, 'data' => $query->orderBy('product_name')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function business(Request $request)
    {
        return response()->json(['success' => true, 'data' => ['customers' => DB::table('customers')->whereNull('deleted_at')->count(), 'vendors' => DB::table('vendors')->whereNull('deleted_at')->count(), 'services' => $this->applyDates(DB::table('services')->whereNull('deleted_at'), $request, 'entry_date')->count(), 'amcs' => $this->applyDates(DB::table('amcs')->whereNull('deleted_at'), $request, 'start_date')->count(), 'assets' => DB::table('assets')->whereNull('deleted_at')->count(), 'rewards' => DB::table('reward_accounts')->count()]]);
    }

    public function rewards(Request $request)
    {
        $query = DB::table('customers')
            ->leftJoin('reward_accounts', 'reward_accounts.customer_id', '=', 'customers.id')
            ->leftJoin('sales', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('sale_payments', 'sale_payments.sale_id', '=', 'sales.id')
            ->whereNull('customers.deleted_at')
            ->select('customers.id', 'customers.company_name', 'reward_accounts.available_points', DB::raw('COALESCE(SUM(sale_payments.amount), 0) as payment_received_amount'))
            ->groupBy('customers.id', 'customers.company_name', 'reward_accounts.available_points');
        if ($request->filled('date_from')) $query->whereDate('sale_payments.payment_date', '>=', $request->date('date_from'));
        if ($request->filled('date_to')) $query->whereDate('sale_payments.payment_date', '<=', $request->date('date_to'));
        return response()->json(['success' => true, 'data' => $query->orderBy('customers.company_name')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function customers(Request $request)
    {
        $query = DB::table('customers')->whereNull('deleted_at')->select('id', 'customer_code', 'company_name', 'contact_person', 'city', 'customer_status');
        if ($request->filled('search')) $query->where('company_name', 'like', '%' . $request->string('search') . '%');
        if ($request->filled('status')) $query->where('customer_status', $request->string('status'));
        return response()->json(['success' => true, 'data' => $query->orderBy('company_name')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function vendors(Request $request)
    {
        $query = DB::table('vendors')->whereNull('deleted_at')->select('id', 'vendor_code', 'company_name', 'contact_person', 'city', 'vendor_status');
        if ($request->filled('search')) $query->where('company_name', 'like', '%' . $request->string('search') . '%');
        if ($request->filled('status')) $query->where('vendor_status', $request->string('status'));
        return response()->json(['success' => true, 'data' => $query->orderBy('company_name')->paginate(min(max($request->integer('per_page', 25), 1), 100))]);
    }

    public function services(Request $request)
    {
        $query = $this->applyDates(DB::table('services')->whereNull('deleted_at')->select('status', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(grand_total), 0) as total_amount'))->groupBy('status'), $request, 'entry_date');
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function amcs(Request $request)
    {
        $query = $this->applyDates(DB::table('amcs')->whereNull('deleted_at')->select('status', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(total_cost), 0) as total_cost'))->groupBy('status'), $request, 'start_date');
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function assets(Request $request)
    {
        $query = DB::table('assets')->whereNull('deleted_at')->select('status', DB::raw('COUNT(*) as total'))->groupBy('status');
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function payments(Request $request)
    {
        $sales = $this->applyDates(DB::table('sale_payments'), $request, 'payment_date')->sum('amount');
        $purchases = $this->applyDates(DB::table('vendor_payments'), $request, 'payment_date')->sum('amount');
        return response()->json(['success' => true, 'data' => ['sales_received' => (float) $sales, 'vendor_payments' => (float) $purchases, 'net_cash_movement' => (float) $sales - (float) $purchases]]);
    }

    public function financialSummary(Request $request)
    {
        $sales = $this->applyDates(DB::table('sales')->whereNull('deleted_at'), $request, 'sale_date')->selectRaw('COALESCE(SUM(grand_total), 0) as total, COALESCE(SUM(paid_amount), 0) as paid, COALESCE(SUM(balance_amount), 0) as outstanding')->first();
        $purchases = $this->applyDates(DB::table('purchases')->whereNull('deleted_at'), $request, 'purchase_date')->selectRaw('COALESCE(SUM(grand_total), 0) as total, COALESCE(SUM(paid_amount), 0) as paid, COALESCE(SUM(balance_amount), 0) as outstanding')->first();
        return response()->json(['success' => true, 'data' => ['sales' => $sales, 'purchases' => $purchases, 'gross_margin' => (float) $sales->total - (float) $purchases->total]]);
    }

    public function gstTaxInvoices(Request $request)
    {
        $validated = $request->validate([
            'financial_year' => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'classification' => ['nullable', 'in:all,b2b,b2c'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = DB::table('sales')
            ->leftJoin('customers', 'customers.id', '=', 'sales.customer_id')
            ->whereNull('sales.deleted_at')
            ->where('sales.invoice_type', 'tax')
            ->select([
                'sales.id', 'sales.sale_date', 'sales.invoice_no',
                'sales.taxable_amount', 'sales.gst_amount', 'sales.grand_total',
                'customers.company_name as customer_name',
                'customers.gst_number as customer_gstin',
                'customers.state as place_of_supply',
            ]);

        if (!empty($validated['from_date'])) $query->whereDate('sales.sale_date', '>=', $validated['from_date']);
        if (!empty($validated['to_date'])) $query->whereDate('sales.sale_date', '<=', $validated['to_date']);
        if (!empty($validated['month'])) $query->whereMonth('sales.sale_date', $validated['month']);
        if (!empty($validated['financial_year'])) {
            [$startYear, $endYear] = array_map('intval', explode('-', $validated['financial_year']));
            $startDate = Carbon::create($startYear, 4, 1)->startOfDay();
            $endDate = Carbon::create($startYear + 1, 3, 31)->endOfDay();
            $query->whereBetween('sales.sale_date', [$startDate, $endDate]);
        }

        $classification = $validated['classification'] ?? 'all';
        if ($classification === 'b2b') $query->whereNotNull('customers.gst_number')->where('customers.gst_number', '<>', '');
        if ($classification === 'b2c') $query->where(function ($customerQuery) { $customerQuery->whereNull('customers.gst_number')->orWhere('customers.gst_number', ''); });
        if (!empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(function ($searchQuery) use ($term) {
                $searchQuery->where('sales.invoice_no', 'like', $term)
                    ->orWhere('customers.company_name', 'like', $term)
                    ->orWhere('customers.gst_number', 'like', $term);
            });
        }

        $invoices = $query->orderBy('sales.sale_date')->orderBy('sales.invoice_no')->get();
        $invoiceIds = $invoices->pluck('id');
        $items = DB::table('sale_items')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->whereIn('sale_items.sale_id', $invoiceIds)
            ->select('sale_items.sale_id', 'sale_items.description', 'sale_items.quantity', 'sale_items.taxable_amount', 'sale_items.gst_percent', 'sale_items.gst_amount', 'sale_items.total_amount', 'products.hsn_code', 'products.product_name')
            ->get();

        $invoiceRows = $invoices->map(function ($invoice) {
            $gst = (float) $invoice->gst_amount;
            return [
                'sale_date' => $invoice->sale_date,
                'invoice_no' => $invoice->invoice_no,
                'customer_name' => $invoice->customer_name ?: '-',
                'customer_gstin' => $invoice->customer_gstin ?: '-',
                'place_of_supply' => $invoice->place_of_supply ?: '-',
                'taxable_value' => (float) $invoice->taxable_amount,
                'cgst' => round($gst / 2, 2),
                'sgst' => round($gst / 2, 2),
                'igst' => 0,
                'total_gst' => $gst,
                'grand_total' => (float) $invoice->grand_total,
            ];
        })->values();

        $groupedItems = $items->groupBy(fn ($item) => ($item->hsn_code ?: 'Not Available') . '|' . (string) $item->gst_percent);
        $hsnSummary = $groupedItems->map(function ($group, $key) {
            [$hsn, $rate] = explode('|', $key, 2);
            $taxable = (float) $group->sum('taxable_amount');
            $gst = (float) $group->sum('gst_amount');
            return ['hsn_sac' => $hsn, 'description' => $group->pluck('product_name')->filter()->unique()->implode(', ') ?: 'Not Available', 'quantity' => (float) $group->sum('quantity'), 'taxable_value' => $taxable, 'gst_rate' => (float) $rate, 'cgst' => round($gst / 2, 2), 'sgst' => round($gst / 2, 2), 'igst' => 0, 'total_gst' => $gst, 'total_value' => (float) $group->sum('total_amount')];
        })->values();

        $rateSummary = $items->groupBy(fn ($item) => (string) $item->gst_percent)->map(function ($group, $rate) {
            $taxable = (float) $group->sum('taxable_amount');
            $gst = (float) $group->sum('gst_amount');
            return ['gst_rate' => (float) $rate, 'taxable_value' => $taxable, 'cgst' => round($gst / 2, 2), 'sgst' => round($gst / 2, 2), 'igst' => 0, 'total_gst' => $gst, 'total_value' => (float) $group->sum('total_amount')];
        })->sortBy('gst_rate')->values();

        $summary = ['total_tax_invoices' => $invoiceRows->count(), 'total_taxable_value' => (float) $invoiceRows->sum('taxable_value'), 'total_cgst' => (float) $invoiceRows->sum('cgst'), 'total_sgst' => (float) $invoiceRows->sum('sgst'), 'total_igst' => 0, 'total_gst' => (float) $invoiceRows->sum('total_gst'), 'total_invoice_value' => (float) $invoiceRows->sum('grand_total')];
        $profile = CompanyProfile::oldest('id')->first();

        return response()->json(['success' => true, 'data' => ['company' => $profile, 'summary' => $summary, 'invoices' => $invoiceRows, 'hsn_summary' => $hsnSummary, 'rate_summary' => $rateSummary, 'filters' => ['financial_year' => $validated['financial_year'] ?? null, 'month' => $validated['month'] ?? null, 'classification' => $classification]]]);
    }
}