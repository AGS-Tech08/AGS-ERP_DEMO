import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

interface CompanyProfile {
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_path?: string;
}

interface Customer { id?: number; company_name?: string; contact_person?: string; mobile?: string; email?: string; address?: string; city?: string; state?: string; gst_number?: string; }
interface Product { id?: number; product_name?: string; hsn_code?: string; }
interface QuotationItem { description?: string; quantity?: number | string; rate?: number | string; discount_amount?: number | string; taxable_amount?: number | string; gst_percent?: number | string; gst_amount?: number | string; total_amount?: number | string; product?: Product | null; }
interface Quotation { quotation_no?: string; quotation_date?: string; valid_until?: string; customer?: Customer | null; items?: QuotationItem[]; subtotal?: number | string; discount_amount?: number | string; taxable_amount?: number | string; gst_amount?: number | string; grand_total?: number | string; notes?: string; terms_conditions?: string; }

export default function QuotationPreview() {
  const { id } = useParams();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [companyResponse, quotationResponse] = await Promise.all([
          api.get("/company-profile"),
          api.get(`/quotations/${id}`),
        ]);
        setCompany(companyResponse.data?.data ?? companyResponse.data);
        setQuotation(quotationResponse.data?.data ?? quotationResponse.data?.quotation ?? quotationResponse.data);
      } catch (error) {
        console.error("Failed to load quotation preview", error);
      }
    };

    if (id) load();
  }, [id]);

  const formatCurrency = (value?: string | number) => Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!company || !quotation) return <div className="p-6">Loading quotation preview...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
        <header className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            {company.logo_path ? <img src={company.logo_path} alt="Company logo" className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-200 text-xs font-semibold text-slate-700">Logo</div>}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.company_name || "Company Name"}</h1>
              <p className="text-sm text-slate-600">{company.address || ""}{company.city ? `, ${company.city}` : ""}{company.state ? `, ${company.state}` : ""}{company.pincode ? ` - ${company.pincode}` : ""}</p>
              <p className="text-sm text-slate-600">{company.phone || "-"} | {company.email || "-"}</p>
              <p className="text-sm text-slate-600">GSTIN: {company.gstin || "-"}</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-bold tracking-wide text-slate-900">QUOTATION</h2>
            <p className="mt-2 text-sm text-slate-600">No: {quotation.quotation_no}</p>
            <p className="text-sm text-slate-600">Date: {formatDate(quotation.quotation_date)}</p>
            <p className="text-sm text-slate-600">Valid Until: {formatDate(quotation.valid_until)}</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-2 font-semibold text-slate-800">Bill To</h3>
            <p className="font-medium">{quotation.customer?.company_name || "-"}</p>
            <p className="text-sm text-slate-600">{quotation.customer?.address || "-"}</p>
            <p className="text-sm text-slate-600">{quotation.customer?.mobile || "-"}</p>
            <p className="text-sm text-slate-600">{quotation.customer?.email || "-"}</p>
            <p className="text-sm text-slate-600">GSTIN: {quotation.customer?.gst_number || "-"}</p>
            <p className="text-sm text-slate-600">State: {quotation.customer?.state || "-"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-2 font-semibold text-slate-800">Company</h3>
            <p className="text-sm text-slate-600">Phone: {company.phone || "-"}</p>
            <p className="text-sm text-slate-600">Email: {company.email || "-"}</p>
            <p className="text-sm text-slate-600">Website: {company.website || "-"}</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">S.No</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">HSN/SAC</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Taxable</th>
                <th className="px-3 py-2">GST</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, index) => (
                <tr key={index} className="border-t border-slate-200">
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">{item.product?.product_name || item.description || "-"}</td>
                  <td className="px-3 py-2">{item.product?.hsn_code || "-"}</td>
                  <td className="px-3 py-2">{item.quantity ?? 0}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.rate)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.discount_amount)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.taxable_amount)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.gst_amount)}</td>
                  <td className="px-3 py-2">₹ {formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <h3 className="mb-2 font-semibold text-slate-800">Terms & Conditions</h3>
              <p className="whitespace-pre-line">{quotation.terms_conditions || "-"}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-slate-800">Notes</h3>
              <p className="whitespace-pre-line">{quotation.notes || "-"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="mb-2 flex items-center justify-between"><span>Subtotal</span><span>₹ {formatCurrency(quotation.subtotal)}</span></div>
            <div className="mb-2 flex items-center justify-between"><span>Discount</span><span>₹ {formatCurrency(quotation.discount_amount)}</span></div>
            <div className="mb-2 flex items-center justify-between"><span>Taxable Amount</span><span>₹ {formatCurrency(quotation.taxable_amount)}</span></div>
            <div className="mb-2 flex items-center justify-between"><span>GST</span><span>₹ {formatCurrency(quotation.gst_amount)}</span></div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Grand Total</span><span>₹ {formatCurrency(quotation.grand_total)}</span></div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
          <div className="mb-4">Amount in words: <span className="font-medium text-slate-900">{formatCurrency(quotation.grand_total)} INR only</span></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Authorized Signature</p>
              <p className="mt-2 text-xs">This is a Computer Generated Quotation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
