import { useEffect, useState } from "react";
import api from "../../services/api";

interface BankAccount {
  id: number;
  bank_name: string;
  account_holder_name: string;
  account_number_masked: string;
  ifsc_code: string;
  branch: string | null;
  account_type: string;
  upi_id: string | null;
  is_active: boolean;
}

interface BankAccountForm {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  account_type: string;
  upi_id: string;
  is_active: boolean;
}

const emptyForm: BankAccountForm = {
  bank_name: "",
  account_holder_name: "",
  account_number: "",
  ifsc_code: "",
  branch: "",
  account_type: "Current",
  upi_id: "",
  is_active: true,
};

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [form, setForm] = useState<BankAccountForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bank-accounts");
      setAccounts(response.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const updateField = <K extends keyof BankAccountForm>(
    field: K,
    value: BankAccountForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setMessage("");
    setError("");
  };

  const editAccount = (account: BankAccount) => {
    setForm({
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name,
      account_number: "",
      ifsc_code: account.ifsc_code,
      branch: account.branch ?? "",
      account_type: account.account_type,
      upi_id: account.upi_id ?? "",
      is_active: account.is_active,
    });
    setEditingId(account.id);
    setMessage("");
    setError("");
  };

  const saveAccount = async () => {
    setMessage("");
    setError("");

    if (!form.bank_name.trim() || !form.account_holder_name.trim() || !form.ifsc_code.trim()) {
      setError("Bank name, account holder name, and IFSC code are required.");
      return;
    }

    if (!editingId && !form.account_number.trim()) {
      setError("Account number is required when adding a bank account.");
      return;
    }

    const payload: Record<string, string | boolean | null> = {
      bank_name: form.bank_name.trim(),
      account_holder_name: form.account_holder_name.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase(),
      branch: form.branch.trim() || null,
      account_type: form.account_type,
      upi_id: form.upi_id.trim() || null,
      is_active: form.is_active,
    };

    if (form.account_number.trim()) {
      payload.account_number = form.account_number.trim();
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/bank-accounts/${editingId}`, payload);
      } else {
        await api.post("/bank-accounts", payload);
      }

      resetForm();
      await loadAccounts();
      setMessage(editingId ? "Bank account updated successfully." : "Bank account added successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to save the bank account.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (account: BankAccount) => {
    if (!window.confirm(`Delete ${account.bank_name} (${account.account_number_masked})?`)) {
      return;
    }

    try {
      setMessage("");
      setError("");
      await api.delete(`/bank-accounts/${account.id}`);
      await loadAccounts();
      setMessage("Bank account deleted successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to delete the bank account.");
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Bank Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage company bank details available for invoices. Account numbers are masked after saving.
        </p>
      </div>

      {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          {editingId ? "Edit Bank Account" : "Add Bank Account"}
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Bank Name" value={form.bank_name} onChange={(value) => updateField("bank_name", value)} />
          <Field label="Account Holder Name" value={form.account_holder_name} onChange={(value) => updateField("account_holder_name", value)} />
          <Field label="Account Number" type="password" value={form.account_number} placeholder={editingId ? "Leave blank to keep the existing number" : "Account number"} onChange={(value) => updateField("account_number", value)} />
          <Field label="IFSC Code" value={form.ifsc_code} onChange={(value) => updateField("ifsc_code", value)} />
          <Field label="Branch" value={form.branch} onChange={(value) => updateField("branch", value)} />
          <Field label="UPI ID (optional)" value={form.upi_id} onChange={(value) => updateField("upi_id", value)} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Account Type</label>
            <select value={form.account_type} onChange={(event) => updateField("account_type", event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500">
              <option value="Current">Current</option>
              <option value="Savings">Savings</option>
              <option value="Overdraft">Overdraft</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <label className="mt-8 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => updateField("is_active", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Active and available for invoices
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>}
          <button type="button" onClick={saveAccount} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update Bank Account" : "Save Bank Account"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold text-slate-800">Saved Bank Accounts</h2></div>
        {loading ? <div className="p-6 text-sm text-slate-500">Loading bank accounts...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-3 font-medium">Bank</th><th className="px-6 py-3 font-medium">Account Holder</th><th className="px-6 py-3 font-medium">Account Number</th><th className="px-6 py-3 font-medium">IFSC</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No bank accounts added yet.</td></tr> : accounts.map((account) => (
                  <tr key={account.id} className="text-slate-700"><td className="px-6 py-4 font-medium">{account.bank_name}<div className="text-xs text-slate-500">{account.branch || "No branch specified"}</div></td><td className="px-6 py-4">{account.account_holder_name}</td><td className="px-6 py-4">{account.account_number_masked}</td><td className="px-6 py-4">{account.ifsc_code}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${account.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{account.is_active ? "Active" : "Inactive"}</span></td><td className="px-6 py-4"><div className="flex gap-3"><button type="button" onClick={() => editAccount(account)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Edit</button><button type="button" onClick={() => deleteAccount(account)} className="text-sm font-medium text-red-600 hover:text-red-700">Delete</button></div></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || label} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" /></div>;
}
