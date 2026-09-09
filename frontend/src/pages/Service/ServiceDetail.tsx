import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Service {
  id: number;
  service_number?: string;
  entry_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status?: string;
  priority?: string;
  payment_status?: string;
  customer_id?: number;
  contact_person?: string;
  phone?: string;
  asset_id?: number;
  device_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  customer_complaint?: string;
  technician_diagnosis?: string;
  work_done?: string;
  final_remarks?: string;
  labour_charge?: number;
  spare_charge?: number;
  other_charge?: number;
  discount_amount?: number;
  taxable_amount?: number;
  gst_percent?: number;
  gst_amount?: number;
  grand_total?: number;
  paid_amount?: number;
  balance_amount?: number;
  service_type?: string;
  remarks?: string;
  accessories?: any[];
  spares?: any[];
  statusHistories?: any[];
  payments?: any[];
  customer?: any;
  asset?: any;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      const data = response.data?.data;
      setService(data);
      setEditForm(data);
    } catch (error) {
      alert("Error loading service");
      navigate("/service");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put(`/services/${id}`, {
        contact_person: editForm.contact_person,
        phone: editForm.phone,
        customer_complaint: editForm.customer_complaint,
        technician_diagnosis: editForm.technician_diagnosis,
        work_done: editForm.work_done,
        final_remarks: editForm.final_remarks,
        labour_charge: editForm.labour_charge,
        other_charge: editForm.other_charge,
        discount_amount: editForm.discount_amount,
        gst_percent: editForm.gst_percent,
        priority: editForm.priority,
        expected_delivery_date: editForm.expected_delivery_date,
        remarks: editForm.remarks,
      });

      if (response.data?.success) {
        setService(response.data.data);
        setEditing(false);
        alert("Service updated successfully");
        loadService();
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || "Failed to update"}`);
    }
  };

  const changeStatus = async (newStatus: string) => {
    try {
      const response = await api.post(`/services/${id}/change-status`, {
        status: newStatus,
      });

      if (response.data?.success) {
        alert("Status updated successfully");
        loadService();
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || "Failed to change status"}`);
    }
  };

  if (loading || !service) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{service.service_number}</h1>
          <p className="text-sm text-slate-500">{service.entry_date?.split("T")[0]}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/service/${id}/reference-challan`} className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-white">Reference Challan</Link>
          <Link to={`/service/${id}/final-challan`} className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Service Challan</Link>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[service.status ?? ""] ?? "bg-slate-100 text-slate-800"}`}>
            {service.status}
          </span>
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-semibold">
            {service.priority}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      {service.statusHistories && service.statusHistories.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Status Timeline</h2>
          <div className="space-y-2">
            {service.statusHistories.map((h, idx) => (
              <div key={idx} className="flex items-start gap-4 text-sm">
                <div className="text-xs text-slate-500 pt-0.5">{h.changed_at?.split("T")[0]}</div>
                <div className="flex-1">
                  {h.old_status && <span className="text-slate-600">{h.old_status}</span>}
                  {h.old_status && <span className="text-slate-400 mx-2">→</span>}
                  <span className="font-semibold text-slate-800">{h.new_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Customer Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Company</label>
            <p className="text-slate-800">{service.customer?.company_name}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Contact Person</label>
            <p className="text-slate-800">{editForm.contact_person}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Phone</label>
            <p className="text-slate-800">{editForm.phone}</p>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Device Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Device Type</label>
            <p className="text-slate-800">{service.device_type}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Brand</label>
            <p className="text-slate-800">{service.brand || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Model</label>
            <p className="text-slate-800">{service.model || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Serial Number</label>
            <p className="text-slate-800">{service.serial_number || "—"}</p>
          </div>
        </div>
      </div>

      {/* Accessories */}
      {service.accessories && service.accessories.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Accessories Received</h2>
          <div className="flex flex-wrap gap-2">
            {service.accessories.map((acc, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {acc.accessory}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Service Details */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Service Details</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Customer Complaint</label>
            {editing ? (
              <textarea
                value={editForm.customer_complaint || ""}
                onChange={(e) => setEditForm({ ...editForm, customer_complaint: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
              />
            ) : (
              <p className="text-slate-800">{service.customer_complaint || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Technician Diagnosis</label>
            {editing ? (
              <textarea
                value={editForm.technician_diagnosis || ""}
                onChange={(e) => setEditForm({ ...editForm, technician_diagnosis: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
              />
            ) : (
              <p className="text-slate-800">{service.technician_diagnosis || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Work Done</label>
            {editing ? (
              <textarea
                value={editForm.work_done || ""}
                onChange={(e) => setEditForm({ ...editForm, work_done: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
              />
            ) : (
              <p className="text-slate-800">{service.work_done || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Final Remarks</label>
            {editing ? (
              <textarea
                value={editForm.final_remarks || ""}
                onChange={(e) => setEditForm({ ...editForm, final_remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            ) : (
              <p className="text-slate-800">{service.final_remarks || "—"}</p>
            )}
          </div>

          {editing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spares */}
      {service.spares && service.spares.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Spares / Materials Used</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {service.spares.map((spare, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2">{spare.product?.product_name}</td>
                    <td className="px-4 py-2">{spare.quantity}</td>
                    <td className="px-4 py-2">₹{Number(spare.rate).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 font-medium">₹{Number(spare.total_amount).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charges */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Service Charges</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Labour Charge</span>
            <span>₹{Number(service.labour_charge || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Spare Charges</span>
            <span>₹{Number(service.spare_charge || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Other Charges</span>
            <span>₹{Number(service.other_charge || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>-₹{Number(service.discount_amount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
            <span>Taxable Amount</span>
            <span>₹{Number(service.taxable_amount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">GST ({service.gst_percent}%)</span>
            <span>₹{Number(service.gst_amount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span>₹{Number(service.grand_total || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment Status</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600">Total Amount</p>
            <p className="text-2xl font-bold text-slate-800">₹{Number(service.grand_total || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600">Paid Amount</p>
            <p className="text-2xl font-bold text-blue-800">₹{Number(service.paid_amount || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600">Balance Due</p>
            <p className="text-2xl font-bold text-orange-800">₹{Number(service.balance_amount || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-700 mt-4">Status: {service.payment_status}</p>
      </div>

      {/* Status Change */}
      {!["Delivered", "Closed"].includes(service.status || "") && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Status</h2>
          <div className="grid gap-2 md:grid-cols-4">
            {[
              "Inspection",
              "Waiting for Approval",
              "Approved",
              "In Service",
              "Waiting for Spare",
              "Testing",
              "Ready for Delivery",
              "Delivered",
              "Closed",
              "Cancelled",
            ]
              .filter((s) => s !== service.status)
              .map((status) => (
                <button
                  key={status}
                  onClick={() => changeStatus(status)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200"
                >
                  {status}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/service")}
          className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
        >
          Back to List
        </button>
        <button
          onClick={() => navigate(`/service/${service?.id}/challan`)}
          className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
        >
          📄 View Challan
        </button>
        <button
          onClick={() => window.open(`/service/${service?.id}/challan`, '_blank')}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          🖨️ Print Challan
        </button>
      </div>
    </div>
  );
}
