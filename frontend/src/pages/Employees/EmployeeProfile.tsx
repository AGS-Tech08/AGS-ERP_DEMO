import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import api from '../../services/api';

type SectionState = { rows: any[]; unavailable: boolean };
const emptySection: SectionState = { rows: [], unavailable: false };

export default function EmployeeProfile() {
	const { id } = useParams();
	const [employee, setEmployee] = useState<any>(null);
	const [error, setError] = useState('');
	const [sections, setSections] = useState<Record<string, SectionState>>({});

	useEffect(() => {
		if (!id) return;
		const load = async () => {
			try {
				const response = await employeeService.get(id);
				setEmployee(response.data?.data);
				const requests = await Promise.allSettled([
					api.get('/tasks', { params: { employee_id: id, per_page: 100 } }),
					api.get('/attendances', { params: { employee_id: id, per_page: 100 } }),
					api.get('/daily-works', { params: { employee_id: id, per_page: 100 } }),
					api.get(`/employees/${id}/skills`),
					api.get('/performances', { params: { employee_id: id, per_page: 100 } }),
				]);
				const names = ['tasks', 'attendance', 'dailyWork', 'skills', 'performance'];
				const next: Record<string, SectionState> = {};
				requests.forEach((result, index) => {
					if (result.status === 'fulfilled') {
						const payload = result.value.data?.data;
						next[names[index]] = { rows: Array.isArray(payload) ? payload : payload?.data ?? [], unavailable: false };
					} else {
						next[names[index]] = { rows: [], unavailable: true };
					}
				});
				setSections(next);
			} catch (requestError: any) {
				setError(`Unable to load employee${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
			}
		};
		void load();
	}, [id]);

	if (error) return <section className="p-6 text-red-600">{error}</section>;
	if (!employee) return <section className="p-6">Loading employee profile...</section>;

	const renderSection = (key: string, title: string, renderRow: (row: any) => React.ReactNode) => {
		const section = sections[key] ?? emptySection;
		return <section className="rounded bg-white p-6 shadow"><h2 className="mb-4 text-xl font-semibold">{title}</h2>{section.unavailable ? <p className="text-amber-700">Not linked or unavailable</p> : section.rows.length === 0 ? <p className="text-gray-500">No records available</p> : <div className="space-y-2">{section.rows.map((row, index) => <div className="rounded border p-3" key={row.id ?? index}>{renderRow(row)}</div>)}</div>}</section>;
	};

	return <section className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link className="text-blue-600" to="/employees">Employees</Link><h1 className="text-3xl font-bold">{employee.user?.name ?? employee.employee_id}</h1><p className="text-gray-500">{employee.designation ?? 'Employee'} · {employee.employee_status}</p></div><Link className="rounded bg-blue-600 px-4 py-2 text-white" to={`/employees/${id}/edit`}>Edit</Link></div><section className="rounded bg-white p-6 shadow"><h2 className="mb-4 text-xl font-semibold">Overview</h2><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><dt className="text-gray-500">Employee ID</dt><dd>{employee.employee_id}</dd></div><div><dt className="text-gray-500">Department</dt><dd>{employee.department?.name ?? '-'}</dd></div><div><dt className="text-gray-500">Reporting Manager</dt><dd>{employee.reporting_manager?.employee_id ?? '-'}</dd></div><div><dt className="text-gray-500">Email</dt><dd>{employee.email ?? employee.user?.email ?? '-'}</dd></div><div><dt className="text-gray-500">Phone</dt><dd>{employee.phone ?? '-'}</dd></div><div><dt className="text-gray-500">Joining Date</dt><dd>{employee.date_of_joining ?? '-'}</dd></div></dl></section>{renderSection('tasks', 'Tasks', row => <><p className="font-semibold">{row.task_title ?? row.task?.task_title ?? '-'}</p><p className="text-sm text-gray-500">{row.task_status ?? row.assignment_status ?? 'No status'}</p></>)}{renderSection('attendance', 'Attendance', row => <><p>{row.attendance_date ?? '-'}</p><p className="text-sm text-gray-500">{row.attendance_status ?? '-'}</p></>)}{renderSection('dailyWork', 'Daily Work', row => <><p>{row.work_description ?? '-'}</p><p className="text-sm text-gray-500">{row.work_date ?? '-'} · {row.hours_spent ?? 0} hours</p></>)}{renderSection('skills', 'Skills', row => <><p className="font-semibold">{row.skill?.skill_name ?? '-'}</p><p className="text-sm text-gray-500">{row.current_level ?? '-'} · {row.status ?? '-'}</p></>)}{renderSection('performance', 'Performance', row => <><p className="font-semibold">{row.review_period ?? '-'}</p><p className="text-sm text-gray-500">Rating: {row.overall_rating ?? '-'} · {row.status ?? '-'}</p></>)}<section className="rounded border border-dashed bg-slate-50 p-6"><h2 className="font-semibold">Other ERP Areas</h2><p className="mt-2 text-sm text-gray-600">Sales, Payments, Assets, AMC, Service History, and Rewards are not linked to the Employee API and are therefore unavailable here. No fake data is shown.</p></section></section>;
}