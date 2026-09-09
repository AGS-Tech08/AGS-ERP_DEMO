import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';

type Option = { id: number; name?: string; employee_id?: string; designation?: string };
type FormState = { employee_id: string; user_id: string; department_id: string; reporting_manager_id: string; designation: string; date_of_joining: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; employee_status: string };

const emptyForm: FormState = { employee_id: '', user_id: '', department_id: '', reporting_manager_id: '', designation: '', date_of_joining: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', employee_status: 'Active' };

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    const load = async () => {
      try {
        const [departmentResponse, employeeResponse] = await Promise.all([
          employeeService.departments({ per_page: 100 }),
          employeeService.list({ per_page: 100 }),
        ]);
        setDepartments(departmentResponse.data?.data?.data ?? []);
        setEmployees(employeeResponse.data?.data?.data ?? []);
        if (id) {
          const response = await employeeService.get(id);
          const employee = response.data?.data;
          setForm({
            ...emptyForm,
            ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, employee?.[key] == null ? '' : String(employee[key])])),
          });
        }
      } catch (requestError: any) {
        setError(`Unable to load employee form${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const payload = {
      ...form,
      user_id: form.user_id ? Number(form.user_id) : null,
      department_id: form.department_id ? Number(form.department_id) : null,
      reporting_manager_id: form.reporting_manager_id ? Number(form.reporting_manager_id) : null,
    };
    try {
      if (id) await employeeService.update(id, payload);
      else await employeeService.create(payload);
      navigate('/employees');
    } catch (requestError: any) {
      setError(`Unable to ${editing ? 'update' : 'create'} employee${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
    }
  };

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  if (loading) return <section className="p-6">Loading employee...</section>;

  return <section className="max-w-4xl space-y-5">
    <div><h1 className="text-3xl font-bold">{editing ? 'Edit Employee' : 'Add Employee'}</h1><p className="text-gray-500">Use existing users, departments, and employees only.</p></div>
    {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
    <form onSubmit={submit} className="grid gap-4 rounded bg-white p-6 shadow sm:grid-cols-2">
      {([['employee_id', 'Employee ID'], ['designation', 'Designation'], ['date_of_joining', 'Date of Joining'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']] as const).map(([key, label]) => <label className="block" key={key}>{label}{key === 'address' ? <textarea className="mt-1 w-full rounded border p-2" value={form[key]} onChange={(event) => update(key, event.target.value)} /> : <input type={key === 'date_of_joining' ? 'date' : key === 'email' ? 'email' : 'text'} required={key === 'employee_id'} className="mt-1 w-full rounded border p-2" value={form[key]} onChange={(event) => update(key, event.target.value)} />}</label>)}
      <label className="block">Existing User ID<input type="number" min="1" className="mt-1 w-full rounded border p-2" value={form.user_id} onChange={(event) => update('user_id', event.target.value)} placeholder="No users endpoint is available" /></label>
      <label className="block">Department<select className="mt-1 w-full rounded border p-2" value={form.department_id} onChange={(event) => update('department_id', event.target.value)}><option value="">Not assigned</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>{departments.length === 0 && <span className="mt-1 block text-sm text-amber-700">No departments available. Please create a department first.</span>}</label>
      <label className="block">Reporting Manager<select className="mt-1 w-full rounded border p-2" value={form.reporting_manager_id} onChange={(event) => update('reporting_manager_id', event.target.value)}><option value="">Not assigned</option>{employees.filter((employee) => String(employee.id) !== id).map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_id}{employee.designation ? ` - ${employee.designation}` : ''}</option>)}</select></label>
      <label className="block">Status<select className="mt-1 w-full rounded border p-2" value={form.employee_status} onChange={(event) => update('employee_status', event.target.value)}><option>Active</option><option>Inactive</option><option>On Leave</option><option>Terminated</option></select></label>
      <div className="flex gap-2 sm:col-span-2"><button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">{editing ? 'Save Changes' : 'Create Employee'}</button><button type="button" className="rounded border px-4 py-2" onClick={() => navigate('/employees')}>Cancel</button></div>
    </form>
  </section>;
}
