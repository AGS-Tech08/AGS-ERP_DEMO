<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDailyWorkRequest;
use App\Http\Requests\UpdateDailyWorkRequest;
use App\Models\DailyWork;
use Illuminate\Http\Request;

class DailyWorkController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyWork::with('employee.user');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('work_type')) {
            $query->where('work_type', $request->string('work_type')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('work_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('work_date', '<=', $request->date('date_to'));
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        return response()->json([
            'success' => true,
            'data' => $query->latest('work_date')->paginate($perPage),
        ]);
    }

    public function store(StoreDailyWorkRequest $request)
    {
        $work = DailyWork::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Daily work entry created successfully.',
            'data' => $work->load('employee.user'),
        ], 201);
    }

    public function show(DailyWork $dailyWork)
    {
        return response()->json([
            'success' => true,
            'data' => $dailyWork->load('employee.user'),
        ]);
    }

    public function update(UpdateDailyWorkRequest $request, DailyWork $dailyWork)
    {
        $dailyWork->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Daily work entry updated successfully.',
            'data' => $dailyWork->fresh()->load('employee.user'),
        ]);
    }

    public function destroy(DailyWork $dailyWork)
    {
        $dailyWork->delete();

        return response()->json([
            'success' => true,
            'message' => 'Daily work entry deleted successfully.',
        ]);
    }
}