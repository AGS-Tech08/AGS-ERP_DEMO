import { useEffect, useState } from "react";
import api from "../../services/api";

const fields = ["show_logo", "show_header", "show_customer", "show_device", "show_accessories", "show_complaint", "show_diagnosis", "show_work_done", "show_spares", "show_charges", "show_signature", "show_terms"] as const;

export default function ServiceTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { const response = await api.get("/service-templates"); const items = response.data?.data || []; setTemplates(items); if (!selected && items[0]) setSelected(items[0].id); };
  useEffect(() => { void load(); }, []);
  const template = templates.find((item) => item.id === Number(selected));
  const save = async () => { if (!template) return; await api.put(`/service-templates/${template.id}/config`, { config: template.config }); setMessage("Service template saved."); await load(); };
  if (!templates.length) return <section className="space-y-4 p-6"><h1 className="text-2xl font-bold">Service Templates</h1><p className="text-slate-500">Templates will be available after the approved migration is run.</p></section>;
  return <section className="max-w-3xl space-y-6 p-6"><div><h1 className="text-2xl font-bold text-slate-900">Service Templates</h1><p className="text-sm text-slate-500">Configure the two read-only service documents.</p></div><select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded border bg-white p-2">{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{template && <div className="rounded-xl border bg-white p-6 shadow-sm"><h2 className="font-semibold">{template.name}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map((field) => <label key={field} className="flex gap-2 text-sm"><input type="checkbox" checked={template.config?.[field] !== false} onChange={(e) => setTemplates(templates.map((item) => item.id === template.id ? { ...item, config: { ...item.config, [field]: e.target.checked } } : item))} />{field.replaceAll("_", " ")}</label>)}</div><button onClick={save} className="mt-5 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save Template</button>{message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}</div>}</section>;
}
