import { useEffect, useState } from "react";
import api from "../../services/api";

interface CustomerLite { id: number; company_name?: string; }
interface RewardAccount { id?: number; customer_id?: number; available_points?: number; total_earned?: number; total_redeemed?: number; }
interface RewardItem { id: number; name?: string; points_required?: number; description?: string; status?: string; }

export default function CustomerRewards() {
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [account, setAccount] = useState<RewardAccount>({});
  const [items, setItems] = useState<RewardItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");

  const loadCustomers = async () => {
    const response = await api.get("/customers");
    const data = response.data?.data?.data ?? response.data?.data ?? [];
    setCustomers(data);
    if (data[0]) {
      setSelectedCustomerId(String(data[0].id));
    }
  };

  const loadAccount = async (customerId: string) => {
    if (!customerId) return;
    const response = await api.get(`/customers/${customerId}/reward`);
    setAccount(response.data?.data ?? {});
  };

  const loadRewardItems = async () => {
    const response = await api.get("/reward-items");
    setItems(response.data?.data ?? []);
  };

  useEffect(() => {
    loadCustomers();
    loadRewardItems();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadAccount(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const redeem = async () => {
    if (!selectedCustomerId || !selectedItemId) return;
    await api.post("/reward-redeem", {
      customer_id: Number(selectedCustomerId),
      reward_item_id: Number(selectedItemId),
    });
    loadAccount(selectedCustomerId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Customer Rewards</h1>
        <p className="text-sm text-slate-500">Reward account summary and redemption</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.company_name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Available Points</p>
            <p className="text-2xl font-bold text-blue-900">{account.available_points ?? 0}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Total Earned</p>
            <p className="text-2xl font-bold text-emerald-900">{account.total_earned ?? 0}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Total Redeemed</p>
            <p className="text-2xl font-bold text-amber-900">{account.total_redeemed ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Redeem Reward</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select Reward Item</option>
            {items.filter((item) => item.status === "Active").map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {item.points_required} points</option>
            ))}
          </select>
          <button type="button" onClick={redeem} className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700">Redeem</button>
        </div>
      </div>
    </div>
  );
}
