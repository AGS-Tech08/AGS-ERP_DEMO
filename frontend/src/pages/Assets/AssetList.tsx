import { useEffect, useState } from "react";
import api from "../../services/api";

interface CustomerLite { id: number; company_name?: string; }
interface AssetRow { id: number; asset_code?: string; device_name?: string; device_type?: string; customer?: CustomerLite; status?: string; }

export default function AssetList() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customer_id: "",
    device_name: "",
    device_type: "Computer",
    category: "",
    brand: "",
    model: "",
    location: "",
    status: "Working",
    remarks: "",
  });

  const loadCustomers = async () => {
    const response = await api.get("/customers");
    setCustomers(response.data?.data?.data ?? response.data?.data ?? []);
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get("/assets");
      setAssets(response.data?.data?.data ?? response.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadAssets();
  }, []);

  const createAsset = async () => {
    try {
      await api.post("/assets", {
        ...form,
        customer_id: Number(form.customer_id),
      });
      setForm({
        customer_id: "",
        device_name: "",
        device_type: "Computer",
        category: "",
        brand: "",
        model: "",
        location: "",
        status: "Working",
        remarks: "",
      });
      await loadAssets();
    } catch (error) {
      console.error("Unable to create asset", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Asset Management</h1>
          <p className="text-sm text-slate-500">Master device inventory and AMC-linked assets</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Add Device</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.company_name}</option>
            ))}
          </select>
          <input value={form.device_name} onChange={(event) => setForm({ ...form, device_name: event.target.value })} placeholder="Device Name" className="rounded-lg border border-slate-300 px-3 py-2" />
          <select value={form.device_type} onChange={(event) => setForm({ ...form, device_type: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="Computer">Computer</option>
            <option value="Laptop">Laptop</option>
            <option value="Printer">Printer</option>
            <option value="Server">Server</option>
            <option value="Router">Router</option>
            <option value="Network Switch">Network Switch</option>
            <option value="Firewall">Firewall</option>
            <option value="CCTV Camera">CCTV Camera</option>
            <option value="NVR">NVR</option>
            <option value="DVR">DVR</option>
            <option value="UPS">UPS</option>
            <option value="Other">Other</option>
          </select>
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Manufacturer / Brand" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Model" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="rounded-lg border border-slate-300 px-3 py-2" />
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="Working">Working</option>
            <option value="Faulty">Faulty</option>
            <option value="Under Service">Under Service</option>
            <option value="Replaced">Replaced</option>
            <option value="Disposed">Disposed</option>
          </select>
          <textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} placeholder="Remarks" rows={3} className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={createAsset} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Save Device</button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Assets</h2>
        {loading ? (
          <div className="text-slate-500">Loading assets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-100 text-sm uppercase text-slate-600">
                <tr>
                  <th className="p-3">Asset Code</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-t border-slate-200">
                    <td className="p-3 font-semibold text-slate-700">{asset.asset_code}</td>
                    <td className="p-3">{asset.device_name}</td>
                    <td className="p-3">{asset.customer?.company_name ?? "-"}</td>
                    <td className="p-3">{asset.device_type}</td>
                    <td className="p-3">{asset.status}</td>
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
