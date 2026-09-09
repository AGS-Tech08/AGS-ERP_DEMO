import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

interface Customer { id?: number; company_name?: string; contact_person?: string; mobile?: string; email?: string; address?: string; city?: string; state?: string; gst_number?: string; }
interface Product { id?: number; product_name?: string; product_code?: string; hsn_code?: string; }
interface QuotationItem { id?: number; description?: string; quantity?: number | string; rate?: number | string; discount_amount?: number | string; taxable_amount?: number | string; gst_percent?: number | string; gst_amount?: number | string; total_amount?: number | string; product?: Product | null; }
interface Quotation { id?: number; quotation_no?: string; quotation_date?: string; valid_until?: string; status?: string; customer?: Customer | null; items?: QuotationItem[]; notes?: string; terms_conditions?: string; subtotal?: number | string; discount_amount?: number | string; taxable_amount?: number | string; gst_amount?: number | string; grand_total?: number | string; }

export default function QuotationDetails() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data?.data ?? response.data?.quotation ?? response.data);
    } catch (error) {
      console.error("Failed to load quotation details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadQuotation(); }, [id]);

  const formatCurrency = (value?: string | number) => Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const changeStatus = async (status: string) => {
    try {
      await api.put(`/quotations/${id}/status`, { status });
      loadQuotation();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to update quotation status.");
    }
  };

  const convertToInvoice = async () => {
    try {
      const response = await api.post(`/quotations/${id}/convert-to-invoice`);
      alert(`Invoice created: ${response.data?.invoice_no || "Generated"}`);
      loadQuotation();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to convert quotation to invoice.");
    }
  };

  if (loading) return <div className="p-6 text-slate-500">Loading quotation...</div>;
  if (!quotation) return <div className="p-6 text-red-600">Quotation not found.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{quotation.quotation_no}</h1>
          <p className="mt-1 text-sm text-slate-500">Quotation details</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sales/quotations" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Back</Link>
          <Link to={`/sales/quotations/${id}/document`} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">Print / PDF</Link>
          <Link to={`/sales/quotations/${id}/edit`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Edit</Link>
          <button type="button" onClick={() => changeStatus("Sent")} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white">Mark Sent</button>
          <button type="button" onClick={convertToInvoice} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">Convert to Invoice</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Customer Information</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{quotation.status || "Draft"}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><div className="text-xs uppercase tracking-wide text-slate-500">Customer</div><div className="font-medium">{quotation.customer?.company_name || "-"}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-slate-500">Contact</div><div className="font-medium">{quotation.customer?.contact_person || "-"}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-slate-500">Phone</div><div className="font-medium">{quotation.customer?.mobile || "-"}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-slate-500">Email</div><div className="font-medium">{quotation.customer?.email || "-"}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-slate-500">City</div><div className="font-medium">{quotation.customer?.city || "-"}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-slate-500">State</div><div className="font-medium">{quotation.customer?.state || "-"}</div></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Quotation Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Quotation Date</span><span>{formatDate(quotation.quotation_date)}</span></div>
            <div className="flex items-center justify-between"><span>Valid Until</span><span>{formatDate(quotation.valid_until)}</span></div>
            <div className="flex items-center justify-between"><span>Subtotal</span><span>₹ {formatCurrency(quotation.subtotal)}</span></div>
            <div className="flex items-center justify-between"><span>Discount</span><span>₹ {formatCurrency(quotation.discount_amount)}</span></div>
            <div className="flex items-center justify-between"><span>GST</span><span>₹ {formatCurrency(quotation.gst_amount)}</span></div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900"><span>Grand Total</span><span>₹ {formatCurrency(quotation.grand_total)}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">HSN/SAC</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Taxable</th>
                <th className="px-3 py-2">GST</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, index) => (
                <tr key={index} className="border-t border-slate-200">
                  <td className="px-3 py-2">{item.product?.product_name || item.description || "-"}</td>
                  <td className="px-3 py-2">{item.product?.hsn_code || "-"}</td>
                  <td className="px-3 py-2">{item.quantity ?? 0}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.rate)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.discount_amount)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.taxable_amount)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.gst_amount)}</td>
                  <td className="px-3 py-2 font-semibold">₹ {formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Notes</h2>
          <p className="whitespace-pre-line text-sm text-slate-600">{quotation.notes || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Terms & Conditions</h2>
          <p className="whitespace-pre-line text-sm text-slate-600">{quotation.terms_conditions || "-"}</p>
        </div>
      </div>
    </div>
  );
}
