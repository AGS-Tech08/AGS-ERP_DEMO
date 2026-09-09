import { useEffect, useState } from "react";
import api from "../../services/api";

interface CustomerLite {
  id: number;
  company_name?: string;
  contact_person?: string;
}

interface AMC {
  id: number;
  amc_number?: string;
  customer?: CustomerLite;
  status?: string;
  start_date?: string;
  end_date?: string;
  agreement_value?: number | string;
  total_cost?: number | string;
}

export default function AMCList() {
  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [form, setForm] = useState({
    customer_id: "",
    start_date: "",
    end_date: "",
    agreement_value: "",
    gst: "",
    total_cost: "",
    payment_terms: "",
    status: "Draft",
    notes: "",
  });

  const loadCustomers = async () => {
    const response = await api.get("/customers");
    setCustomers(response.data?.data?.data ?? response.data?.data ?? []);
  };

  const loadAmcs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/amcs", {
        params: customerId ? { customer_id: customerId } : {},
      });
      setAmcs(response.data?.data?.data ?? response.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadAmcs();
  }, []);

  useEffect(() => {
    loadAmcs();
  }, [customerId]);

  const createAmc = async () => {
    try {
      await api.post("/amcs", {
        ...form,
        customer_id: Number(form.customer_id),
        agreement_value: Number(form.agreement_value || 0),
        gst: Number(form.gst || 0),
        total_cost: Number(form.total_cost || 0),
      });
      setForm({
        customer_id: "",
        start_date: "",
        end_date: "",
        agreement_value: "",
        gst: "",
        total_cost: "",
        payment_terms: "",
        status: "Draft",
        notes: "",
      });
      await loadAmcs();
    } catch (error) {
      console.error("Unable to create AMC", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">AMC Management</h1>
          <p className="text-sm text-slate-500">Customer-backed AMC contracts and coverage</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Create AMC</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.company_name}</option>
            ))}
          </select>
          <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="number" value={form.agreement_value} onChange={(event) => setForm({ ...form, agreement_value: event.target.value })} placeholder="Agreement Value" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="number" value={form.gst} onChange={(event) => setForm({ ...form, gst: event.target.value })} placeholder="GST" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="number" value={form.total_cost} onChange={(event) => setForm({ ...form, total_cost: event.target.value })} placeholder="Total Cost" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="text" value={form.payment_terms} onChange={(event) => setForm({ ...form, payment_terms: event.target.value })} placeholder="Payment Terms" className="rounded-lg border border-slate-300 px-3 py-2" />
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes / Remarks" className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2" rows={3} />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={createAmc} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Create AMC</button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">AMC List</h2>
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.company_name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading AMC records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-100 text-sm uppercase text-slate-600">
                <tr>
                  <th className="p-3">AMC</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {amcs.map((amc) => (
                  <tr key={amc.id} className="border-t border-slate-200">
                    <td className="p-3 font-semibold text-slate-700">{amc.amc_number}</td>
                    <td className="p-3">{amc.customer?.company_name ?? "-"}</td>
                    <td className="p-3">{amc.start_date} → {amc.end_date}</td>
                    <td className="p-3">{amc.status}</td>
                    <td className="p-3">₹{Number(amc.total_cost ?? 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
