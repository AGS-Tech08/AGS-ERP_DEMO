<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with('employee.user');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('attendance_status')) {
            $query->where('attendance_status', $request->string('attendance_status')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('attendance_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('attendance_date', '<=', $request->date('date_to'));
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        return response()->json([
            'success' => true,
            'data' => $query->latest('attendance_date')->paginate($perPage),
        ]);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        if (Attendance::where('employee_id', $data['employee_id'])
            ->whereDate('attendance_date', $data['attendance_date'])
            ->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance already exists for this employee and date.',
            ], 422);
        }

        $attendance = Attendance::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Attendance created successfully.',
            'data' => $attendance->load('employee.user'),
        ], 201);
    }

    public function show(Attendance $attendance)
    {
        return response()->json([
            'success' => true,
            'data' => $attendance->load('employee.user'),
        ]);
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $data = $request->validated();
        $employeeId = $data['employee_id'] ?? $attendance->employee_id;
        $attendanceDate = $data['attendance_date'] ?? $attendance->attendance_date;

        $duplicate = Attendance::where('employee_id', $employeeId)
            ->whereDate('attendance_date', $attendanceDate)
            ->where('id', '!=', $attendance->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance already exists for this employee and date.',
            ], 422);
        }

        $attendance->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully.',
            'data' => $attendance->fresh()->load('employee.user'),
        ]);
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance deleted successfully.',
        ]);
    }

    public function checkIn(CheckInRequest $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'The authenticated user is not linked to an employee.',
            ], 422);
        }

        $today = now()->toDateString();
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if ($attendance?->check_in_time) {
            return response()->json([
                'success' => false,
                'message' => 'You have already checked in today.',
                'data' => $attendance->load('employee.user'),
            ], 422);
        }

        $attendance ??= new Attendance([
            'employee_id' => $employee->id,
            'attendance_date' => $today,
            'attendance_status' => 'Present',
        ]);
        $attendance->check_in_time = $request->input('check_in_time', now());
        $attendance->attendance_status = 'Present';
        $attendance->remarks = $request->input('remarks', $attendance->remarks);
        $attendance->save();

        return response()->json([
            'success' => true,
            'message' => 'Checked in successfully.',
            'data' => $attendance->load('employee.user'),
        ], 201);
    }

    public function checkOut(CheckOutRequest $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'The authenticated user is not linked to an employee.',
            ], 422);
        }

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', now()->toDateString())
            ->first();

        if (!$attendance || !$attendance->check_in_time) {
            return response()->json([
                'success' => false,
                'message' => 'Check in before checking out.',
            ], 422);
        }

        if ($attendance->check_out_time) {
            return response()->json([
                'success' => false,
                'message' => 'You have already checked out today.',
                'data' => $attendance->load('employee.user'),
            ], 422);
        }

        $checkOut = Carbon::parse($request->input('check_out_time', now()));
        if ($checkOut->lt($attendance->check_in_time)) {
            return response()->json([
                'success' => false,
                'message' => 'Check-out time cannot be before check-in time.',
            ], 422);
        }

        $attendance->check_out_time = $checkOut;
        if ($request->filled('remarks')) {
            $attendance->remarks = $request->input('remarks');
        }
        $attendance->save();

        return response()->json([
            'success' => true,
            'message' => 'Checked out successfully.',
            'data' => $attendance->load('employee.user'),
        ]);
    }
}