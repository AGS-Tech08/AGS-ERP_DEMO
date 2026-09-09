import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { employeeService } from '../../services/employeeService';

type Department = { id: number; name: string; description?: string | null; employees_count?: number };
type DepartmentForm = { name: string; description: string };

const emptyForm: DepartmentForm = { name: '', description: '' };

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await employeeService.departments({ per_page: 100 });
      setDepartments(response.data?.data?.data ?? []);
    } catch (requestError: any) {
      setError(`Unable to load departments${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadDepartments(); }, []);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) => `${department.name} ${department.description ?? ''}`.toLowerCase().includes(term));
  }, [departments, search]);

  const startCreate = () => { setEditingId(null); setForm(emptyForm); setError(''); setNotice(''); };
  const startEdit = (department: Department) => { setEditingId(department.id); setForm({ name: department.name, description: department.description ?? '' }); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const saveDepartment = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { setError('Department name is required.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || null };
      if (editingId) { await employeeService.updateDepartment(editingId, payload); setNotice('Department updated successfully.'); }
      else { await employeeService.createDepartment(payload); setNotice('Department created successfully.'); }
      setForm(emptyForm); setEditingId(null); await loadDepartments();
    } catch (requestError: any) {
      const validation = requestError?.response?.data?.errors;
      const validationMessage = validation ? Object.values(validation).flat().join(' ') : '';
      setError(`${editingId ? 'Unable to update' : 'Unable to create'} department${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${validationMessage || requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
    } finally { setSaving(false); }
  };

  const deleteDepartment = async (department: Department) => {
    if (!window.confirm(`Delete department "${department.name}"?`)) return;
    setError(''); setNotice('');
    try { await employeeService.removeDepartment(department.id); setNotice('Department deleted successfully.'); await loadDepartments(); }
    catch (requestError: any) { setError(`Unable to delete department${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || 'Employees may still be assigned to this department.'}`); }
  };

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-blue-600">AGS-ERP Master Data</p><h1 className="text-3xl font-bold text-slate-900">Department Master</h1><p className="text-slate-500">Manage departments used by the employee directory.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadDepartments()} className="rounded border bg-white px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button><button type="button" onClick={startCreate} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add Department</button></div></div>
    {(error || notice) && <div className={`rounded border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || notice}</div>}
    <form onSubmit={saveDepartment} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Department' : 'Create Department'}</h2>{editingId && <button type="button" onClick={startCreate} className="text-sm text-slate-500 underline">Cancel edit</button>}</div><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Department Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Administration" /></label><label className="block text-sm font-medium text-slate-700">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={1} placeholder="Optional description" /></label></div><button disabled={saving} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Department'}</button></form>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Departments</h2><p className="text-sm text-slate-500">{departments.length} department{departments.length === 1 ? '' : 's'} configured</p></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>{loading ? <p className="py-8 text-center text-slate-500">Loading departments...</p> : filteredDepartments.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">{departments.length === 0 ? 'No departments found. Add the approved departments manually.' : 'No departments match your search.'}</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Department Name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Employee Count</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{filteredDepartments.map((department) => <tr key={department.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold text-slate-900">{department.name}</td><td className="px-4 py-3 text-slate-600">{department.description || '-'}</td><td className="px-4 py-3 text-slate-600">{department.employees_count ?? 0}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => startEdit(department)} className="mr-3 text-blue-600 hover:underline">Edit</button><button type="button" onClick={() => void deleteDepartment(department)} className="text-red-600 hover:underline">Delete</button></td></tr>)}</tbody></table></div>}</div>
  </section>;
}
