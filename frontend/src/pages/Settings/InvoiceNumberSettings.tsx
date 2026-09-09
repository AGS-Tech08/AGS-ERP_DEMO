import { useEffect, useState } from "react";
import api from "../../services/api";

type InvoiceType = "tax" | "normal";
type Settings = {
  invoice_type: InvoiceType;
  prefix: string;
  start_number: number;
  next_number: number;
  number_padding: number;
  include_date: boolean;
  include_financial_year: boolean;
  financial_year_start_month: number;
  last_financial_year?: string | null;
};

const defaults: Record<InvoiceType, Settings> = {
  tax: { invoice_type: "tax", prefix: "AGS", start_number: 1, next_number: 1, number_padding: 3, include_date: false, include_financial_year: true, financial_year_start_month: 4, last_financial_year: null },
  normal: { invoice_type: "normal", prefix: "AGSN", start_number: 1, next_number: 1, number_padding: 3, include_date: false, include_financial_year: true, financial_year_start_month: 4, last_financial_year: null },
};

function financialYear(startMonth: number) {
  const now = new Date();
  const startYear = now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
}

function example(settings: Settings) {
  const year = settings.include_financial_year ? financialYear(settings.financial_year_start_month).replace("-", "") : settings.include_date ? new Date().toISOString().slice(0, 10).replaceAll("-", "") : "";
  return `${settings.prefix}${year}${String(settings.next_number).padStart(settings.number_padding, "0")}`;
}

export default function InvoiceNumberSettings() {
  const [settings, setSettings] = useState<Record<InvoiceType, Settings>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<InvoiceType | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [taxResponse, normalResponse] = await Promise.all([
        api.get("/invoice-number-settings", { params: { invoice_type: "tax" } }),
        api.get("/invoice-number-settings", { params: { invoice_type: "normal" } }),
      ]);
      setSettings({
        tax: { ...defaults.tax, ...(taxResponse.data?.data ?? {}) },
        normal: { ...defaults.normal, ...(normalResponse.data?.data ?? {}) },
      });
    } catch (requestError: any) {
      setError(`${requestError?.response?.data?.message || requestError?.message || "Unable to load invoice number settings."} Apply the approved migration before saving these settings.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const update = (type: InvoiceType, field: keyof Settings, value: string | number | boolean) => {
    setMessage("");
    setError("");
    setSettings((current) => ({ ...current, [type]: { ...current[type], [field]: value } }));
  };

  const save = async (type: InvoiceType) => {
    setSaving(type);
    setMessage("");
    setError("");
    try {
      await api.put("/invoice-number-settings", settings[type]);
      setMessage(`${type === "tax" ? "Tax" : "Normal"} invoice settings saved successfully.`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to save invoice number settings.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-6 text-slate-500">Loading invoice number settings...</div>;

  return <section className="max-w-5xl space-y-6"><div><h1 className="text-3xl font-bold text-slate-800">Invoice Number Settings</h1><p className="mt-1 text-sm text-slate-500">Configure independent sequences for new Tax and Normal invoices. Existing invoice numbers are never changed.</p></div>{message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{message}</div>}{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-2"><SettingsCard type="tax" settings={settings.tax} saving={saving === "tax"} onChange={update} onSave={save} /><SettingsCard type="normal" settings={settings.normal} saving={saving === "normal"} onChange={update} onSave={save} /></div></section>;
}
function SettingsCard({ type, settings, saving, onChange, onSave }: { type: InvoiceType; settings: Settings; saving: boolean; onChange: (type: InvoiceType, field: keyof Settings, value: string | number | boolean) => void; onSave: (type: InvoiceType) => void }) {
  const label = type === "tax" ? "Tax Invoice Number" : "Normal Invoice Number";
  return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-xl font-semibold text-slate-900">{label}</h2><div className="space-y-4"><Field label="Prefix" value={settings.prefix} onChange={(value) => onChange(type, "prefix", value)} /><Field label="Financial Year" value={financialYear(settings.financial_year_start_month)} readOnly /><Field label="Next Number" type="number" value={settings.next_number} onChange={(value) => onChange(type, "next_number", Number(value) || 1)} /><Field label="Padding" type="number" value={settings.number_padding} onChange={(value) => onChange(type, "number_padding", Number(value) || 1)} /><label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={settings.include_financial_year} onChange={(event) => onChange(type, "include_financial_year", event.target.checked)} />Include Financial Year</label><label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={settings.include_date} onChange={(event) => onChange(type, "include_date", event.target.checked)} />Include Date</label><div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><span className="font-semibold">Example:</span> {example(settings)}</div><button type="button" disabled={saving} onClick={() => onSave(type)} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : `Save ${type === "tax" ? "Tax" : "Normal"} Settings`}</button></div></div>;
}
function Field({ label, value, onChange, type = "text", readOnly = false }: { label: string; value: string | number; onChange?: (value: string) => void; type?: string; readOnly?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} className={`mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 ${readOnly ? "bg-slate-100" : ""}`} /></label>;
}
