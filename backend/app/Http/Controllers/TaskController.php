<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignTaskRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskAssignmentRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    private array $relations = [
        'createdByEmployee:id,employee_id,user_id,designation',
        'createdByEmployee.user:id,name,email',
        'assignments.employee:id,employee_id,user_id,designation,employee_status',
        'assignments.employee.user:id,name,email',
    ];

    public function index(Request $request)
    {
        $query = Task::with($this->relations)->withCount('assignments');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($taskQuery) use ($search) {
                $taskQuery->where('task_title', 'like', "%{$search}%")
                    ->orWhere('task_description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('task_status')) {
            $query->where('task_status', $request->string('task_status')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('employee_id')) {
            $query->whereHas('assignments', function ($assignmentQuery) use ($request) {
                $assignmentQuery->where('employee_id', $request->integer('employee_id'));
            });
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate($perPage),
        ]);
    }

    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();
        $data['created_by_employee_id'] = $data['created_by_employee_id'] ?? $request->user()->employee?->id;

        $task = Task::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully.',
            'data' => $task->load($this->relations),
        ], 201);
    }

    public function show(Task $task)
    {
        return response()->json([
            'success' => true,
            'data' => $task->load($this->relations),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully.',
            'data' => $task->fresh()->load($this->relations),
        ]);
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully.',
        ]);
    }

    public function assign(AssignTaskRequest $request, Task $task)
    {
        $data = $request->validated();
        $data['assigned_date'] = $data['assigned_date'] ?? now()->toDateString();
        $data['assignment_status'] = $data['assignment_status'] ?? 'Assigned';
        $data['completion_percentage'] = $data['completion_percentage'] ?? 0;

        $assignment = $task->assignments()->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Task assigned successfully.',
            'data' => $assignment->load('employee.user'),
        ], 201);
    }

    public function updateAssignment(
        UpdateTaskAssignmentRequest $request,
        Task $task,
        TaskAssignment $assignment
    ) {
        abort_unless($assignment->task_id === $task->id, 404);

        $assignment->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Task assignment updated successfully.',
            'data' => $assignment->fresh()->load('employee.user'),
        ]);
    }
}