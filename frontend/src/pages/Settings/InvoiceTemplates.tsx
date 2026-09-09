import { useEffect, useState } from "react";
import { Eye, Check, Loader2, FileText } from "lucide-react";
import api from "../../services/api";
import InvoiceTemplateRenderer, {
  type InvoiceTemplateData,
  type InvoiceRenderData,
} from "../../components/invoice/InvoiceTemplateRenderer";

type TemplateResponse = {
  data?: InvoiceTemplateData[];
};

const templateInfo: Record<
  string,
  {
    title: string;
    description: string;
    style: string;
  }
> = {
  "classic-tax-invoice": {
    title: "Tally Prime ERP",
    description:
      "Professional Tally Prime style GST invoice with complete HSN/SAC, tax summary, buyer and delivery details.",
    style: "ERP / GST / Detailed",
  },

  "modern-erp-invoice": {
    title: "AGS Classic GST",
    description:
      "Professional AGS GST invoice design with company header, customer details, tax summary and bank details.",
    style: "Classic / Professional",
  },

  "compact-tax-invoice": {
    title: "AGS Compact GST",
    description:
      "Compact GST invoice design suitable for quick billing and clean A4 printing.",
    style: "Compact / Clean",
  },
};

const fallbackInfo = {
  title: "Invoice Template",
  description:
    "Professional AGS ERP invoice template.",
  style: "GST Invoice",
};

const demoData: InvoiceRenderData = {
  company: {
    company_name: "ADITYA GLOBAL SOLUTIONS",
    address: "18G, Dheena Complex, Chinnakadai Veethi",
    city: "Manapparai",
    state: "Tamil Nadu",
    pincode: "621306",
    gstin: "33GUWPK6741J1ZW",
    phone: "+91 7871355921",
    email: "agsmnp306@gmail.com",
    website: "www.adityags.com",
    bankAccounts: [
      {
        bank_name: "FEDERAL BANK",
        account_number_masked: "********1818",
        ifsc_code: "FDRL0002517",
        branch: "MANAPPARAI",
      },
    ],
  },

  sale: {
    invoice_no: "PREVIEW-0001",
    invoice_type: "tax",
    gst_type: "cgst_sgst",
    sale_date: new Date().toLocaleDateString("en-IN"),

    subtotal: 5000,
    discount_amount: 0,
    taxable_amount: 5000,
    gst_amount: 900,
    other_charges: 0,
    grand_total: 5900,

    customer: {
      company_name: "Sample Customer",
      address: "Customer Address",
      city: "Manapparai",
      state: "Tamil Nadu",
      pincode: "621306",
      gst_number: "33XXXXXXXXXXXXXX",
      mobile: "+91 9000000000",
    },

    items: [
      {
        description: "CCTV Camera",
        quantity: 2,
        rate: 2500,
        discount_amount: 0,
        taxable_amount: 5000,
        gst_percent: 18,
        gst_amount: 900,
        total_amount: 5900,
        product: {
          product_name: "CCTV Camera",
          hsn_code: "85258020",
          unit: "PCS",
        },
      },
    ],
  },
};

export default function InvoiceTemplates() {
  const [templates, setTemplates] = useState<
    InvoiceTemplateData[]
  >([]);

  const [selectedTemplate, setSelectedTemplate] =
    useState<InvoiceTemplateData | null>(null);

  const [previewTemplate, setPreviewTemplate] =
    useState<InvoiceTemplateData | null>(null);

  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(
    null,
  );

  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<TemplateResponse>(
        "/invoice-templates",
      );

      const list = response.data?.data || [];

      setTemplates(list);

      const defaultTemplate =
        list.find((item) => item.is_default) ||
        list[0] ||
        null;

      setSelectedTemplate(defaultTemplate);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load invoice templates. Please check API/login.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectTemplate(template: InvoiceTemplateData) {
    if (!template.id) return;

    try {
      setSelecting(template.id);

      await api.post(
        `/invoice-templates/${template.id}/set-default`,
      );

      setTemplates((current) =>
        current.map((item) => ({
          ...item,
          is_default: item.id === template.id,
        })),
      );

      setSelectedTemplate({
        ...template,
        is_default: true,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Unable to select invoice template.",
      );
    } finally {
      setSelecting(null);
    }
  }

  function getInfo(template: InvoiceTemplateData) {
    return (
      templateInfo[template.slug] ||
      fallbackInfo
    );
  }

  function getTemplateClass(slug: string) {
    if (
      slug.includes("classic-tax") ||
      slug.includes("tally") ||
      slug === "classic"
    ) {
      return "tally";
    }

    if (
      slug.includes("modern") ||
      slug.includes("ags-classic")
    ) {
      return "classic";
    }

    return "compact";
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading invoice templates...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice Templates
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Choose the default invoice design for AGS ERP.
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CURRENT TEMPLATE */}
      {selectedTemplate && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Current Default Template
              </div>

              <div className="mt-1 text-lg font-bold text-emerald-950">
                {getInfo(selectedTemplate).title}
              </div>

              <div className="text-sm text-emerald-800">
                This template will be used for invoice rendering.
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              <Check className="h-4 w-4" />
              Selected
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE CARDS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {templates.map((template) => {
          const info = getInfo(template);

          const isSelected =
            selectedTemplate?.id === template.id ||
            template.is_default;

          const templateClass =
            getTemplateClass(template.slug);

          return (
            <div
              key={template.id || template.slug}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isSelected
                  ? "border-emerald-400 ring-2 ring-emerald-100"
                  : "border-slate-200"
              }`}
            >
              {/* CARD HEADER */}
              <div className="flex items-start justify-between border-b border-slate-100 p-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Template {templates.indexOf(template) + 1}
                  </div>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {info.title}
                  </h2>

                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {info.style}
                  </div>
                </div>

                {isSelected && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    DEFAULT
                  </span>
                )}
              </div>

              {/* VISUAL PREVIEW */}
              <div className="bg-slate-100 p-4">
                <div
                  className={`invoice-thumbnail invoice-thumbnail-${templateClass}`}
                >
                  <div className="invoice-thumb-top">
                    <div className="invoice-thumb-logo">
                      AGS
                    </div>

                    <div className="invoice-thumb-company">
                      <strong>
                        ADITYA GLOBAL SOLUTIONS
                      </strong>
                      <span>
                        GSTIN: 33GUWPK6741J1ZW
                      </span>
                    </div>

                    <div className="invoice-thumb-title">
                      TAX INVOICE
                    </div>
                  </div>

                  <div className="invoice-thumb-buyer">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="invoice-thumb-table">
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                  </div>

                  <div className="invoice-thumb-total">
                    <span />
                    <strong>₹ 5,900.00</strong>
                  </div>

                  <div className="invoice-thumb-footer">
                    <span />
                    <span />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="p-5">
                <p className="min-h-[60px] text-sm leading-6 text-slate-600">
                  {template.description ||
                    info.description}
                </p>

                {/* ACTIONS */}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewTemplate(template)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Preview
                  </button>

                  <button
                    type="button"
                    disabled={
                      isSelected ||
                      selecting === template.id
                    }
                    onClick={() =>
                      selectTemplate(template)
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isSelected
                        ? "cursor-default bg-emerald-100 text-emerald-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {selecting === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}

                    {isSelected
                      ? "Selected"
                      : "Select"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NO TEMPLATES */}
      {templates.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h3 className="mt-3 text-lg font-bold text-slate-800">
            No invoice templates found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Please check the backend invoice template records.
          </p>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewTemplate(null);
            }
          }}
        >
          <div className="flex h-[95vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {getInfo(previewTemplate).title}
                </h2>

                <p className="text-xs text-slate-500">
                  Invoice Preview
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewTemplate(null)
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* PREVIEW */}
            <div className="min-h-0 flex-1 overflow-auto bg-slate-200 p-6">
              <InvoiceTemplateRenderer
                template={previewTemplate}
                data={demoData}
              />
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .invoice-thumbnail {
            width: 100%;
            aspect-ratio: 0.707;
            background: white;
            border: 1px solid #cbd5e1;
            padding: 10px;
            box-sizing: border-box;
            box-shadow: 0 5px 15px rgba(15,23,42,.08);
            overflow: hidden;
          }

          .invoice-thumb-top {
            display: grid;
            grid-template-columns: 34px 1fr 65px;
            gap: 5px;
            align-items: center;
            padding-bottom: 7px;
            border-bottom: 1px solid #111827;
          }

          .invoice-thumb-logo {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #111827;
            font-size: 8px;
            font-weight: 800;
          }

          .invoice-thumb-company {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 6px;
          }

          .invoice-thumb-company strong {
            font-size: 7px;
          }

          .invoice-thumb-title {
            text-align: right;
            font-size: 7px;
            font-weight: 800;
          }

          .invoice-thumb-buyer {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px 3px;
            border-bottom: 1px solid #111827;
          }

          .invoice-thumb-buyer span {
            display: block;
            height: 3px;
            width: 70%;
            background: #cbd5e1;
          }

          .invoice-thumb-buyer span:nth-child(2) {
            width: 50%;
          }

          .invoice-thumb-buyer span:nth-child(3) {
            width: 35%;
          }

          .invoice-thumb-table {
            margin-top: 8px;
            display: grid;
            grid-template-columns: 12px 1fr 25px 25px 35px;
            grid-auto-rows: 10px;
            border-top: 1px solid #111827;
            border-left: 1px solid #111827;
          }

          .invoice-thumb-table div {
            border-right: 1px solid #111827;
            border-bottom: 1px solid #111827;
            background: #fff;
          }

          .invoice-thumb-table div:nth-child(-n+5) {
            background: #f1f5f9;
          }

          .invoice-thumb-total {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            padding: 6px;
            border: 1px solid #111827;
            font-size: 7px;
          }

          .invoice-thumb-total span {
            width: 35%;
            height: 4px;
            background: #cbd5e1;
          }

          .invoice-thumb-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-top: 8px;
          }

          .invoice-thumb-footer span {
            height: 40px;
            border: 1px solid #111827;
          }

          .invoice-thumbnail-tally {
            font-family: Arial, sans-serif;
          }

          .invoice-thumbnail-tally .invoice-thumb-top {
            border-bottom: 2px solid #111827;
          }

          .invoice-thumbnail-classic {
            border-radius: 2px;
          }

          .invoice-thumbnail-classic .invoice-thumb-title {
            font-size: 8px;
          }

          .invoice-thumbnail-compact {
            font-size: 5px;
            padding: 8px;
          }

          .invoice-thumbnail-compact .invoice-thumb-table {
            grid-auto-rows: 8px;
          }

          .invoice-thumbnail-compact .invoice-thumb-footer span {
            height: 30px;
          }
        `}
      </style>
    </div>
  );
}