import { useEffect, useState } from "react";
import api from "../../services/api";

const fields = ["show_logo", "show_header", "show_customer", "show_product_table", "show_tax_columns", "show_bank_details", "show_terms", "show_signature", "show_amount_in_words"] as const;

export default function QuotationTemplates() {
  const [template, setTemplate] = useState<any>(null);
  const [message, setMessage] = useState("");
  const load = async () => { const response = await api.get("/quotation-templates"); setTemplate(response.data?.data?.[0] || { id: null, name: "Professional Quotation", config: {} }); };
  useEffect(() => { void load(); }, []);
  const save = async () => { if (!template) return; if (!template.id) await api.post("/quotation-templates", { name: template.name, slug: "professional-quotation", description: "A4 quotation document", config: template.config, is_active: true, is_default: true }); else await api.put(`/quotation-templates/${template.id}/config`, { config: template.config }); setMessage("Quotation template saved."); await load(); };
  if (!template) return <div className="p-6">Loading quotation templates...</div>;
  return <section className="max-w-3xl space-y-6 p-6"><div><h1 className="text-2xl font-bold text-slate-900">Quotation Templates</h1><p className="text-sm text-slate-500">Configure the dedicated quotation document using existing company and bank data.</p></div><div className="rounded-xl border bg-white p-6 shadow-sm"><label className="block text-sm font-medium">Template Name<input value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map((field) => <label key={field} className="flex gap-2 text-sm"><input type="checkbox" checked={template.config?.[field] !== false} onChange={(e) => setTemplate({ ...template, config: { ...template.config, [field]: e.target.checked } })} />{field.replaceAll("_", " ")}</label>)}</div><label className="mt-5 block text-sm font-medium">Footer Text<textarea value={template.config?.footer_text || "This is a Computer Generated Quotation"} onChange={(e) => setTemplate({ ...template, config: { ...template.config, footer_text: e.target.value } })} className="mt-1 w-full rounded border p-2" rows={2} /></label><button onClick={save} className="mt-5 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save Template</button>{message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}</div></section>;
}
