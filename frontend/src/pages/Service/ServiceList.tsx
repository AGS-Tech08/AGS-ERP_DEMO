import { useEffect, useState } from "react";
import api from "../../services/api";

interface Customer { id: number; company_name?: string; }
interface Technician { id: number; name?: string; }
interface Service { 
  id: number;
  service_number?: string; 
  entry_date?: string;
  customer?: Customer;
  device_type?: string;
  customer_complaint?: string;
  assigned_technician?: Technician;
  expected_delivery_date?: string;
  status?: string;
  grand_total?: number;
}

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    customer_id: "",
    device_type: "",
    status: "",
    assigned_technician_id: "",
    search: "",
  });

  const loadCustomers = async () => {
    const response = await api.get("/customers?per_page=1000");
    setCustomers(response.data?.data?.data ?? []);
  };

  const loadTechnicians = async () => {
    try {
      const response = await api.get("/users?per_page=1000");
      setTechnicians(response.data?.data?.data ?? []);
    } catch {
      setTechnicians([]);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      );
      const response = await api.get("/services", { params });
      setServices(response.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadTechnicians();
    loadServices();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(loadServices, 300);
    return () => clearTimeout(debounce);
  }, [filters]);

  const statusColors: Record<string, string> = {
    "Received": "bg-blue-100 text-blue-800",
    "Inspection": "bg-indigo-100 text-indigo-800",
    "Waiting for Approval": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-emerald-100 text-emerald-800",
    "In Service": "bg-purple-100 text-purple-800",
    "Waiting for Spare": "bg-orange-100 text-orange-800",
    "Testing": "bg-sky-100 text-sky-800",
    "Ready for Delivery": "bg-cyan-100 text-cyan-800",
    "Delivered": "bg-green-100 text-green-800",
    "Closed": "bg-gray-100 text-gray-800",
    "Cancelled": "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Service Management</h1>
          <p className="text-sm text-slate-500">Customer device service and repair tracking</p>
        </div>
        <a href="/service/create" className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700">
          + New Service
        </a>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <input
            type="text"
            placeholder="Search by number, serial, phone"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select 
            value={filters.customer_id} 
            onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          <select 
            value={filters.device_type} 
            onChange={(e) => setFilters({ ...filters, device_type: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Devices</option>
            <option value="DVR">DVR</option>
            <option value="Computer">Computer</option>
            <option value="Laptop">Laptop</option>
            <option value="Camera">Camera</option>
            <option value="Mobile">Mobile</option>
            <option value="Router">Router</option>
            <option value="Switch">Switch</option>
            <option value="Other">Other</option>
          </select>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Inspection">Inspection</option>
            <option value="Approved">Approved</option>
            <option value="In Service">In Service</option>
            <option value="Testing">Testing</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Closed">Closed</option>
          </select>
          <select 
            value={filters.assigned_technician_id} 
            onChange={(e) => setFilters({ ...filters, assigned_technician_id: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Technicians</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading services...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Service #</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 font-semibold">Complaint</th>
                  <th className="px-4 py-3 font-semibold">Technician</th>
                  <th className="px-4 py-3 font-semibold">Expected Delivery</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{service.service_number}</td>
                    <td className="px-4 py-3 text-slate-600">{service.entry_date?.split("T")[0]}</td>
                    <td className="px-4 py-3">{service.customer?.company_name ?? "—"}</td>
                    <td className="px-4 py-3">{service.device_type ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 line-clamp-1">{service.customer_complaint ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{service.assigned_technician?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{service.expected_delivery_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[service.status ?? ""] ?? "bg-slate-100 text-slate-800"}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">₹{Number(service.grand_total ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <a href={`/service/${service.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {services.length === 0 && (
              <div className="text-center py-8 text-slate-500">No services found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
