<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePerformanceRequest;
use App\Http\Requests\UpdatePerformanceRequest;
use App\Models\Performance;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Performance::with('employee.user', 'employee.department');
        if ($request->filled('employee_id')) $query->where('employee_id', $request->integer('employee_id'));
        if ($request->filled('review_period')) $query->where('review_period', 'like', '%' . $request->string('review_period')->toString() . '%');
        if ($request->filled('date_from')) $query->whereDate('review_date', '>=', $request->date('date_from'));
        if ($request->filled('date_to')) $query->whereDate('review_date', '<=', $request->date('date_to'));
        if ($request->filled('status')) $query->where('status', $request->string('status')->toString());
        return response()->json(['success' => true, 'data' => $query->latest('review_date')->paginate(min(max($request->integer('per_page', 10), 1), 100))]);
    }

    public function store(StorePerformanceRequest $request)
    {
        $performance = Performance::create($request->validated());
        return response()->json(['success' => true, 'message' => 'Performance review created successfully.', 'data' => $performance->load('employee.user')], 201);
    }

    public function show(Performance $performance)
    {
        return response()->json(['success' => true, 'data' => $performance->load('employee.user', 'employee.department')]);
    }

    public function update(UpdatePerformanceRequest $request, Performance $performance)
    {
        $performance->update($request->validated());
        return response()->json(['success' => true, 'message' => 'Performance review updated successfully.', 'data' => $performance->fresh()->load('employee.user')]);
    }

    public function destroy(Performance $performance)
    {
        $performance->delete();
        return response()->json(['success' => true, 'message' => 'Performance review deleted successfully.']);
    }
}