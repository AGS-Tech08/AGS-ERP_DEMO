<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeSkillRequest;
use App\Http\Requests\StoreSkillRequest;
use App\Http\Requests\UpdateSkillRequest;
use App\Models\Employee;
use App\Models\EmployeeSkill;
use App\Models\Skill;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    public function index(Request $request)
    {
        $query = Skill::withCount('employeeSkills');
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('skill_name', 'like', "%{$search}%")->orWhere('category', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category')) $query->where('category', $request->string('category')->toString());
        if ($request->filled('status')) $query->where('status', $request->string('status')->toString());
        return response()->json(['success' => true, 'data' => $query->orderBy('skill_name')->paginate(min(max($request->integer('per_page', 10), 1), 100))]);
    }

    public function store(StoreSkillRequest $request)
    {
        return response()->json(['success' => true, 'message' => 'Skill created successfully.', 'data' => Skill::create($request->validated())], 201);
    }

    public function show(Skill $skill)
    {
        return response()->json(['success' => true, 'data' => $skill->load('employeeSkills.employee.user')]);
    }

    public function update(UpdateSkillRequest $request, Skill $skill)
    {
        $skill->update($request->validated());
        return response()->json(['success' => true, 'message' => 'Skill updated successfully.', 'data' => $skill->fresh()]);
    }

    public function destroy(Skill $skill)
    {
        if ($skill->employeeSkills()->exists()) return response()->json(['success' => false, 'message' => 'Skill cannot be deleted while assigned to employees.'], 422);
        $skill->delete();
        return response()->json(['success' => true, 'message' => 'Skill deleted successfully.']);
    }

    public function employeeSkills(Employee $employee)
    {
        return response()->json(['success' => true, 'data' => $employee->employeeSkills()->with('skill')->latest()->get()]);
    }

    public function assign(EmployeeSkillRequest $request, Employee $employee)
    {
        if ($employee->employeeSkills()->where('skill_id', $request->integer('skill_id'))->exists()) {
            return response()->json(['success' => false, 'message' => 'This skill is already assigned to the employee.'], 422);
        }
        $assignment = $employee->employeeSkills()->create($request->validated());
        return response()->json(['success' => true, 'message' => 'Skill assigned successfully.', 'data' => $assignment->load('skill')], 201);
    }

    public function updateEmployeeSkill(EmployeeSkillRequest $request, Employee $employee, Skill $skill)
    {
        $assignment = $employee->employeeSkills()->where('skill_id', $skill->id)->firstOrFail();
        $assignment->update($request->validated());
        return response()->json(['success' => true, 'message' => 'Employee skill updated successfully.', 'data' => $assignment->fresh()->load('skill')]);
    }

    public function removeEmployeeSkill(Employee $employee, Skill $skill)
    {
        $deleted = $employee->employeeSkills()->where('skill_id', $skill->id)->delete();
        abort_if(!$deleted, 404);
        return response()->json(['success' => true, 'message' => 'Employee skill removed successfully.']);
    }
}