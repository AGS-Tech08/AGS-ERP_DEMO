import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

interface Customer {
  id: number;
  company_name?: string;
  contact_person?: string;
  mobile?: string;
}

interface QuotationItem {
  id?: number;
  product?: { product_name?: string; product_code?: string } | null;
}

interface Quotation {
  id: number;
  quotation_no: string;
  quotation_date: string;
  valid_until: string;
  customer?: Customer | null;
  items?: QuotationItem[];
  subtotal?: string | number;
  discount_amount?: string | number;
  gst_amount?: string | number;
  grand_total?: string | number;
  status?: string;
}

export default function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { per_page: "20" };

      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;

      const response = await api.get("/quotations", { params });
      setQuotations(response.data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch quotations", error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadQuotations(), 200);
    return () => clearTimeout(timer);
  }, [search, status]);

  const formatCurrency = (value?: string | number) => {
    const number = Number(value ?? 0);
    return number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusClass = (itemStatus?: string) => {
    switch (itemStatus) {
      case "Accepted":
        return "bg-emerald-100 text-emerald-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Expired":
        return "bg-amber-100 text-amber-700";
      case "Sent":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const duplicateQuotation = async (id: number) => {
    try {
      await api.post(`/quotations/${id}/duplicate`);
      alert("Quotation duplicated successfully.");
      loadQuotations();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to duplicate quotation.");
    }
  };

  const convertToInvoice = async (id: number) => {
    try {
      const response = await api.post(`/quotations/${id}/convert-to-invoice`);
      alert(`Invoice created successfully: ${response.data?.invoice_no || "Generated"}`);
      loadQuotations();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to convert quotation to invoice.");
    }
  };

  const deleteQuotation = async (id: number) => {
    if (!window.confirm("Delete this quotation?")) return;

    try {
      await api.delete(`/quotations/${id}`);
      alert("Quotation deleted successfully.");
      loadQuotations();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to delete quotation.");
    }
  };

  const rows = useMemo(() => quotations, [quotations]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">Manage quotation lifecycle and conversion</p>
        </div>

        <Link to="/sales/quotations/create" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + New Quotation
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotation or customer"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 md:max-w-md"
          />

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3">Quotation</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">GST</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-slate-500">Loading quotations...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-slate-500">No quotations found.</td>
                </tr>
              ) : (
                rows.map((quotation) => (
                  <tr key={quotation.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{quotation.quotation_no}</td>
                    <td className="px-4 py-3">{formatDate(quotation.quotation_date)}</td>
                    <td className="px-4 py-3">{formatDate(quotation.valid_until)}</td>
                    <td className="px-4 py-3">{quotation.customer?.company_name || "-"}</td>
                    <td className="px-4 py-3">₹ {formatCurrency(quotation.subtotal)}</td>
                    <td className="px-4 py-3">₹ {formatCurrency(quotation.discount_amount)}</td>
                    <td className="px-4 py-3">₹ {formatCurrency(quotation.gst_amount)}</td>
                    <td className="px-4 py-3 font-semibold">₹ {formatCurrency(quotation.grand_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(quotation.status)}`}>
                        {quotation.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/sales/quotations/${quotation.id}`} className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300">View</Link>
                        <Link to={`/sales/quotations/${quotation.id}/edit`} className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">Edit</Link>
                        <button type="button" onClick={() => duplicateQuotation(quotation.id)} className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200">Duplicate</button>
                        <button type="button" onClick={() => convertToInvoice(quotation.id)} className="rounded-md bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-200">Invoice</button>
                        <button type="button" onClick={() => deleteQuotation(quotation.id)} className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
