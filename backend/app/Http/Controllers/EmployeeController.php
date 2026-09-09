<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    private array $summaryRelations = [
        'user:id,name,email',
        'department:id,name',
        'reportingManager:id,employee_id,designation',
    ];

    public function index(Request $request)
    {
        $query = Employee::with($this->summaryRelations);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($employeeQuery) use ($search) {
                $employeeQuery->where('employee_id', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('employee_status')) {
            $query->where('employee_status', $request->string('employee_status')->toString());
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('employee_id')->paginate($perPage),
        ]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        $employee = Employee::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully.',
            'data' => $employee->load($this->summaryRelations),
        ], 201);
    }

    public function show(Employee $employee)
    {
        return response()->json([
            'success' => true,
            'data' => $employee->load([
                ...$this->summaryRelations,
                'subordinates:id,employee_id,designation,employee_status',
            ]),
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee)
    {
        $employee->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data' => $employee->fresh()->load($this->summaryRelations),
        ]);
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully.',
        ]);
    }
}