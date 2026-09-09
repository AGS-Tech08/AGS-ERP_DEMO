import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { amountInWords, dateText, downloadElementAsPdf, money } from "../../utils/document";

export default function QuotationDocument() {
  const { id } = useParams();
  const paper = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => { if (id) api.get(`/quotations/${id}/document`).then((response) => setData(response.data?.data)).catch(console.error); }, [id]);
  if (!data) return <div className="p-6">Loading quotation document...</div>;

  const { company, bank_accounts: banks, quotation, template_config: config } = data;
  const customer = quotation.customer ?? {};
  const print = () => window.print();
  const download = () => paper.current && downloadElementAsPdf(paper.current, `${quotation.quotation_no}.pdf`);
  const taxRate = Number(quotation.items?.[0]?.gst_percent ?? 0);
  const cgst = Number(quotation.gst_amount ?? 0) / 2;
  const sgst = Number(quotation.gst_amount ?? 0) / 2;

  return <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end gap-2"><button onClick={print} className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Print</button><button onClick={download} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Download PDF</button></div>
    <article ref={paper} className="mx-auto min-h-[297mm] max-w-[210mm] bg-white p-[16mm] text-[10px] text-slate-800 shadow print:shadow-none">
      {config.show_header && <header className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
        <div className="flex gap-4">{config.show_logo && company?.logo_path && <img src={company.logo_path} alt="Company logo" className="h-16 w-16 object-contain" />}<div><h1 className="text-xl font-bold uppercase">{company?.company_name || "Company Name"}</h1><p>{company?.address}{company?.city ? `, ${company.city}` : ""}{company?.state ? `, ${company.state}` : ""} {company?.pincode}</p><p>{company?.phone} | {company?.email}</p><p>GSTIN: {company?.gstin || "-"} | {company?.website || ""}</p></div></div>
        <div className="text-right"><h2 className="text-2xl font-bold tracking-widest">QUOTATION</h2><p className="mt-2">No: <b>{quotation.quotation_no}</b></p><p>Date: {dateText(quotation.quotation_date)}</p><p>Valid Until: {dateText(quotation.valid_until)}</p></div>
      </header>}
      {config.show_customer && <section className="my-5 grid grid-cols-2 gap-4 border-b border-slate-300 pb-4"><div><h3 className="mb-1 font-bold uppercase">Bill To</h3><p className="font-semibold">{customer.company_name || "-"}</p><p>{customer.address}{customer.city ? `, ${customer.city}` : ""}{customer.state ? `, ${customer.state}` : ""}</p><p>Phone: {customer.mobile || "-"}</p><p>Email: {customer.email || "-"}</p></div><div><h3 className="mb-1 font-bold uppercase">Customer Tax Details</h3><p>GSTIN: {customer.gst_number || "-"}</p><p>State: {customer.state || "-"}</p><p>Contact: {customer.contact_person || "-"}</p></div></section>}
      {config.show_product_table && <table className="w-full border-collapse"><thead><tr className="bg-slate-900 text-left text-white"><th className="p-2">S.No</th><th className="p-2">Product</th><th className="p-2">Description</th><th className="p-2">HSN/SAC</th><th className="p-2">Qty</th><th className="p-2">Unit</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Discount</th><th className="p-2 text-right">Taxable</th><th className="p-2 text-right">GST</th><th className="p-2 text-right">Total</th></tr></thead><tbody>{(quotation.items || []).map((item: any, index: number) => <tr key={item.id || index} className="border-b border-slate-200"><td className="p-2">{index + 1}</td><td className="p-2">{item.product?.product_name || "-"}</td><td className="p-2">{item.description || "-"}</td><td className="p-2">{item.hsn_code || item.product?.hsn_code || "-"}</td><td className="p-2">{item.quantity}</td><td className="p-2">{item.product?.unit || "-"}</td><td className="p-2 text-right">₹ {money(item.rate)}</td><td className="p-2 text-right">₹ {money(item.discount_amount)}</td><td className="p-2 text-right">₹ {money(item.taxable_amount)}</td><td className="p-2 text-right">{item.gst_percent ?? taxRate}% / ₹ {money(item.gst_amount)}</td><td className="p-2 text-right font-semibold">₹ {money(item.total_amount)}</td></tr>)}</tbody></table>}
      <section className="mt-6 flex justify-end"><div className="w-72 space-y-1 text-right"><p>Subtotal: ₹ {money(quotation.subtotal)}</p><p>Discount: ₹ {money(quotation.discount_amount)}</p><p>Taxable Amount: ₹ {money(quotation.taxable_amount)}</p>{config.show_tax_columns && <><p>CGST: ₹ {money(cgst)}</p><p>SGST: ₹ {money(sgst)}</p><p>IGST: ₹ 0.00</p></>}<p className="border-t border-slate-900 pt-2 text-base font-bold">Grand Total: ₹ {money(quotation.grand_total)}</p></div></section>
      {config.show_amount_in_words && <p className="mt-5 border-t border-slate-200 pt-3"><b>Amount in Words:</b> {amountInWords(quotation.grand_total)}</p>}
      <section className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-4">{config.show_bank_details && <div><h3 className="font-bold uppercase">Bank Details</h3>{banks?.[0] ? <><p>{banks[0].bank_name}</p><p>A/c: {banks[0].account_number_masked}</p><p>IFSC: {banks[0].ifsc_code} | Branch: {banks[0].branch}</p><p>UPI: {banks[0].upi_id || "-"}</p></> : <p>Bank details unavailable</p>}{config.show_terms && <><h3 className="mt-4 font-bold uppercase">Terms & Conditions</h3><p className="whitespace-pre-line">{quotation.terms_conditions || "-"}</p></>}</div>}{config.show_signature && <div className="flex flex-col justify-end text-right"><p className="mb-12">For {company?.company_name || "Company"}</p><p className="border-t border-slate-500 pt-1">Authorized Signature</p></div>}</section>
      {config.show_footer && <footer className="mt-8 border-t border-slate-900 pt-2 text-center text-[9px]">{config.footer_text}</footer>}
    </article>
  </div>;
}
