import { useEffect, useState } from "react";
import api from "../../services/api";

interface RewardSettingsData {
  purchase_amount?: number;
  reward_points?: number;
  minimum_redeem_points?: number;
  points_expiry_days?: number;
  enable_points_expiry?: boolean;
}

interface RewardItem { id?: number; name?: string; points_required?: number; description?: string; status?: string; }

export default function RewardSettings() {
  const [settings, setSettings] = useState<RewardSettingsData>({});
  const [items, setItems] = useState<RewardItem[]>([]);
  const [form, setForm] = useState({ name: "", points_required: "", description: "", status: "Active" });

  const loadSettings = async () => {
    const response = await api.get("/reward-settings");
    setSettings(response.data?.data ?? {});
  };

  const loadItems = async () => {
    const response = await api.get("/reward-items");
    setItems(response.data?.data ?? []);
  };

  useEffect(() => {
    loadSettings();
    loadItems();
  }, []);

  const saveSettings = async () => {
    await api.put("/reward-settings", {
      purchase_amount: Number(settings.purchase_amount ?? 100),
      reward_points: Number(settings.reward_points ?? 10),
      minimum_redeem_points: Number(settings.minimum_redeem_points ?? 100),
      points_expiry_days: Number(settings.points_expiry_days ?? 365),
      enable_points_expiry: Boolean(settings.enable_points_expiry ?? true),
    });
    await loadSettings();
  };

  const addItem = async () => {
    await api.post("/reward-items", {
      name: form.name,
      points_required: Number(form.points_required),
      description: form.description,
      status: form.status,
    });
    setForm({ name: "", points_required: "", description: "", status: "Active" });
    await loadItems();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Reward Settings</h1>
        <p className="text-sm text-slate-500">Configure the reward engine and redemption behavior</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Reward Rules</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input type="number" value={settings.purchase_amount ?? 100} onChange={(event) => setSettings({ ...settings, purchase_amount: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Purchase Amount" />
          <input type="number" value={settings.reward_points ?? 10} onChange={(event) => setSettings({ ...settings, reward_points: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Reward Points" />
          <input type="number" value={settings.minimum_redeem_points ?? 100} onChange={(event) => setSettings({ ...settings, minimum_redeem_points: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Minimum Redeem Points" />
          <input type="number" value={settings.points_expiry_days ?? 365} onChange={(event) => setSettings({ ...settings, points_expiry_days: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Points Expiry Days" />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(settings.enable_points_expiry ?? true)} onChange={(event) => setSettings({ ...settings, enable_points_expiry: event.target.checked })} />
          Enable Points Expiry
        </label>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveSettings} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">Save Settings</button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Reward Items</h2>
        <div className="mb-4 grid gap-4 md:grid-cols-4">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Item Name" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={form.points_required} onChange={(event) => setForm({ ...form, points_required: event.target.value })} placeholder="Points Required" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-lg border border-slate-300 px-3 py-2" />
          <button type="button" onClick={addItem} className="rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700">+ Add Reward Item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-100 text-sm uppercase text-slate-600">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Points</th>
                <th className="p-3">Description</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="p-3 font-medium text-slate-700">{item.name}</td>
                  <td className="p-3">{item.points_required}</td>
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
