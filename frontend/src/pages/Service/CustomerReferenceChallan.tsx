import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { dateText, downloadElementAsPdf } from "../../utils/document";

export default function CustomerReferenceChallan() {
  const { id } = useParams();
  const paper = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  useEffect(() => { if (id) api.get(`/services/${id}/document/reference`).then((response) => setData(response.data?.data)).catch(console.error); }, [id]);
  if (!data) return <div className="p-6">Loading customer reference challan...</div>;
  const { company, service, template_config: config } = data;
  const asset = service.asset || {};
  return <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0"><div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end gap-2"><button onClick={() => window.print()} className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Print</button><button onClick={() => paper.current && downloadElementAsPdf(paper.current, `${service.service_number}-reference.pdf`)} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Download PDF</button></div><article ref={paper} className="mx-auto min-h-[297mm] max-w-[210mm] bg-white p-[16mm] text-sm text-slate-800 shadow print:shadow-none">
    {config.show_header && <header className="flex items-start justify-between border-b-2 border-slate-900 pb-5"><div className="flex gap-4">{config.show_logo && company?.logo_path && <img src={company.logo_path} alt="Company logo" className="h-16 w-16 object-contain" />}<div><h1 className="text-xl font-bold">{company?.company_name}</h1><p>{company?.address}, {company?.city}, {company?.state} {company?.pincode}</p><p>{company?.phone} | {company?.email}</p><p>GSTIN: {company?.gstin || "-"}</p></div></div><div className="text-right"><h2 className="text-2xl font-bold">CUSTOMER REFERENCE CHALLAN</h2><p className="mt-2">Service Reference: <b>{service.service_number}</b></p></div></header>}
    {config.show_customer && <section className="my-6 grid grid-cols-2 gap-6"><div><h3 className="mb-2 font-bold uppercase">Customer Details</h3><p className="font-semibold">{service.customer?.company_name}</p><p>{service.contact_person || service.customer?.contact_person}</p><p>Phone: {service.phone || service.customer?.mobile}</p><p>{service.customer?.address}, {service.customer?.city}, {service.customer?.state}</p></div><div><h3 className="mb-2 font-bold uppercase">Entry Details</h3><p>Entry Date: {dateText(service.entry_date)}</p><p>Expected Delivery: {dateText(service.expected_delivery_date)}</p></div></section>}
    {config.show_device && <section className="border-y border-slate-300 py-5"><h3 className="mb-3 font-bold uppercase">Asset / Device Details</h3><div className="grid grid-cols-2 gap-3"><p>Device: {service.device_type || asset.device_type || asset.device_name || "-"}</p><p>Brand: {service.brand || asset.brand || "-"}</p><p>Model: {service.model || asset.model || "-"}</p><p>Serial Number: {service.serial_number || asset.serial_number || "-"}</p><p>Asset Code: {asset.asset_code || "-"}</p></div></section>}
    {config.show_accessories && <section className="py-5"><h3 className="mb-2 font-bold uppercase">Accessories Received</h3><p>{service.accessories?.map((item: any) => item.accessory).join(", ") || "None recorded"}</p></section>}
    {config.show_complaint && <section className="border-t border-slate-300 py-5"><h3 className="mb-2 font-bold uppercase">Customer Complaint</h3><p className="min-h-20 whitespace-pre-line">{service.customer_complaint || "-"}</p></section>}
    <section className="mt-10 grid grid-cols-2 gap-12"><div className="border-t border-slate-500 pt-2">Customer Signature</div><div className="border-t border-slate-500 pt-2">Company Acknowledgement</div></section>
    {config.show_footer && <footer className="mt-16 border-t border-slate-900 pt-2 text-center text-xs">{config.footer_text}</footer>}
  </article></div>;
}
