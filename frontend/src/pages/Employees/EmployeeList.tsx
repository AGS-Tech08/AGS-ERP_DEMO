import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import api from '../../services/api';

type Employee = { id: number; employee_id: string; designation?: string; employee_status: string; phone?: string; email?: string; date_of_joining?: string; user?: { name?: string; email?: string }; department?: { name?: string } };
type PageData = { data: Employee[]; current_page?: number; last_page?: number; total?: number };

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [total, setTotal] = useState(0);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const load = async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const [employeeResult, departmentResult] = await Promise.allSettled([
        employeeService.list({ page: nextPage, per_page: 100, search: search || undefined, employee_status: status || undefined, department_id: departmentId || undefined }),
        api.get('/departments', { params: { per_page: 100 } }),
      ]);
      if (employeeResult.status === 'rejected') throw employeeResult.reason;
      const result = employeeResult.value.data?.data as PageData | undefined;
      const rows = result?.data ?? [];
      setEmployees(rows);
      setAllEmployees(rows);
      setTotal(result?.total ?? rows.length);
      setPages(result?.last_page ?? 1);
      setPage(result?.current_page ?? nextPage);
      if (departmentResult.status === 'fulfilled') setDepartments(departmentResult.value.data?.data?.data ?? []);
    } catch (requestError: any) {
      const statusCode = requestError?.response?.status;
      const message = requestError?.response?.data?.message || requestError?.message || 'Request failed.';
      setError(`Unable to load employees${statusCode ? ` (HTTP ${statusCode})` : ''}: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(1); }, [status, departmentId]);

  const activeCount = allEmployees.filter((employee) => employee.employee_status === 'Active').length;
  const inactiveCount = allEmployees.filter((employee) => employee.employee_status !== 'Active').length;

  return <section className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Employee Management</h1><p className="text-gray-500">Employee directory and reporting structure</p></div><div className="flex gap-2"><button onClick={() => void load(page)} className="rounded border bg-white px-4 py-2 text-slate-700">Refresh</button><Link className="rounded bg-blue-600 px-4 py-2 text-white" to="/employees/new">Add Employee</Link></div></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded bg-white p-4 shadow"><p className="text-sm text-gray-500">Total Employees</p><p className="text-2xl font-bold">{total}</p></div><div className="rounded bg-white p-4 shadow"><p className="text-sm text-gray-500">Active Employees</p><p className="text-2xl font-bold text-emerald-600">{activeCount}</p></div><div className="rounded bg-white p-4 shadow"><p className="text-sm text-gray-500">Inactive Employees</p><p className="text-2xl font-bold text-slate-600">{inactiveCount}</p></div></div><div className="flex flex-wrap gap-2"><input className="rounded border p-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee" /><button className="rounded bg-slate-800 px-4 py-2 text-white" onClick={() => void load(1)}>Search</button><select className="rounded border p-2" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Active</option><option>Inactive</option><option>On Leave</option><option>Terminated</option></select><select className="rounded border p-2" value={departmentId} onChange={e => setDepartmentId(e.target.value)}><option value="">All departments</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>{error && <div className="rounded bg-red-50 p-3 text-red-700">{error} <button className="ml-3 underline" onClick={() => void load(page)}>Retry</button></div>}{loading ? <p>Loading employees...</p> : employees.length === 0 ? <p className="rounded bg-white p-6">No employees found.</p> : <div className="overflow-x-auto rounded bg-white shadow"><table className="min-w-full text-left"><thead><tr className="border-b"><th className="p-3">Employee ID</th><th className="p-3">Employee Name</th><th className="p-3">Designation</th><th className="p-3">Department</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Joining Date</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{employees.map(employee => <tr className="border-b" key={employee.id}><td className="p-3"><Link className="text-blue-600" to={`/employees/${employee.id}`}>{employee.employee_id}</Link></td><td className="p-3">{employee.user?.name ?? employee.user?.email ?? '-'}</td><td className="p-3">{employee.designation ?? '-'}</td><td className="p-3">{employee.department?.name ?? '-'}</td><td className="p-3">{employee.phone ?? '-'}</td><td className="p-3">{employee.email ?? employee.user?.email ?? '-'}</td><td className="p-3">{employee.date_of_joining ?? '-'}</td><td className="p-3">{employee.employee_status}</td><td className="p-3"><Link className="mr-3 text-blue-600" to={`/employees/${employee.id}`}>View</Link><Link className="text-blue-600" to={`/employees/${employee.id}/edit`}>Edit</Link></td></tr>)}</tbody></table></div>}<div className="flex gap-3"><button disabled={page <= 1} onClick={() => void load(page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button><span className="py-1">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => void load(page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button></div></section>;
}