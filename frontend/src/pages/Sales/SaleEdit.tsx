import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import api from "../../services/api";

type InvoiceType = "normal" | "tax" | "service_challan";

interface Customer {
  id: number;
  customer_code?: string;
  company_name: string;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gst_number?: string | null;
}

interface Product {
  id: number;
  product_name: string;
  product_code?: string | null;
  hsn_code?: string | null;
  unit?: string | null;
  sale_price?: string | number | null;
  selling_price?: string | number | null;
  gst_percentage?: string | number | null;
  stock_quantity?: string | number | null;
  current_stock?: string | number | null;
}

interface ServiceSpare {
  id: number;
  service_id?: number;
  product_id?: number;
  quantity?: string | number;
  rate?: string | number;
  discount_amount?: string | number;
  taxable_amount?: string | number;
  gst_percent?: string | number;
  gst_amount?: string | number;
  total_amount?: string | number;
  product?: Product | null;
}

interface Service {
  id: number;
  service_no?: string | null;
  customer_id?: number | null;
  customer?: Customer | null;
  description?: string | null;
  labour_charge?: string | number | null;
  spare_charge?: string | number | null;
  other_charge?: string | number | null;
  discount_amount?: string | number | null;
  taxable_amount?: string | number | null;
  gst_percent?: string | number | null;
  gst_amount?: string | number | null;
  grand_total?: string | number | null;
  status?: string | null;
  spares?: ServiceSpare[];
  service_spares?: ServiceSpare[];
}

interface SaleItem {
  id: number;
  product_id?: number | null;
  service_id?: number | null;
  service_spare_id?: number | null;
  item_type?: "product" | "service" | "spare" | string;
  description?: string | null;
  quantity: string | number;
  rate: string | number;
  discount_amount: string | number;
  taxable_amount: string | number;
  gst_percent: string | number;
  gst_amount: string | number;
  total_amount: string | number;
  product?: Product | null;
  service?: Service | null;
  serviceSpare?: ServiceSpare | null;
  service_spare?: ServiceSpare | null;
}

interface Payment {
  id: number;
  payment_date: string;
  amount: string | number;
  payment_mode: string;
  reference_no?: string | null;
  notes?: string | null;
}

interface Sale {
  id: number;
  invoice_no: string;
  invoice_type: InvoiceType;
  customer_id: number;
  service_id?: number | null;
  sale_date: string;

  subtotal: string | number;
  discount_amount: string | number;
  taxable_amount: string | number;
  gst_amount: string | number;
  other_charges: string | number;
  grand_total: string | number;

  paid_amount: string | number;
  balance_amount: string | number;

  payment_status: string;
  sale_status: string;

  notes?: string | null;

  customer?: Customer | null;
  service?: Service | null;
  items: SaleItem[];
  payments: Payment[];
}

interface ProductRow {
  product_id: number | "";
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
}

interface SpareRow {
  service_spare_id: number | "";
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
  description: string;
}

const toNumber = (
  value: string | number | null | undefined,
): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getDateInputValue = (date: string | null | undefined) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date.substring(0, 10);
  }

  return value.toISOString().substring(0, 10);
};

export default function SaleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState<Sale | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<number | "">("");

  const [invoiceType, setInvoiceType] =
    useState<InvoiceType>("normal");

  const [saleDate, setSaleDate] = useState("");

  const [selectedServiceId, setSelectedServiceId] =
    useState<number | "">("");

  const [includeServiceCharges, setIncludeServiceCharges] =
    useState(false);

  const [productRows, setProductRows] =
    useState<ProductRow[]>([]);

  const [spareRows, setSpareRows] =
    useState<SpareRow[]>([]);

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;

    return (
      services.find(
        (service) =>
          service.id === Number(selectedServiceId),
      ) ?? null
    );
  }, [services, selectedServiceId]);

  const availableSpares = useMemo(() => {
    if (!selectedService) return [];

    return (
      selectedService.spares ??
      selectedService.service_spares ??
      []
    );
  }, [selectedService]);

  const isNormal = invoiceType === "normal";
  const isTax = invoiceType === "tax";
  const isChallan =
    invoiceType === "service_challan";

  useEffect(() => {
    if (!id) return;

    loadData();
  }, [id]);

  useEffect(() => {
    if (!selectedService) return;

    if (
      selectedService.customer_id &&
      !selectedCustomerId
    ) {
      setSelectedCustomerId(
        Number(selectedService.customer_id),
      );
    }
  }, [selectedService]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        saleResponse,
        customerResponse,
        productResponse,
        serviceResponse,
      ] = await Promise.all([
        api.get(`/sales/${id}`),
        api.get("/customers"),
        api.get("/products"),
        api.get("/services"),
      ]);

      const saleData =
        saleResponse.data?.sale ??
        saleResponse.data?.data ??
        saleResponse.data;

      const customerData =
        customerResponse.data?.data ??
        customerResponse.data?.customers ??
        customerResponse.data;

      const productData =
        productResponse.data?.data ??
        productResponse.data?.products ??
        productResponse.data;

      const serviceData =
        serviceResponse.data?.data ??
        serviceResponse.data?.services ??
        serviceResponse.data;

      const normalizedCustomers = Array.isArray(
        customerData,
      )
        ? customerData
        : [];

      const normalizedProducts = Array.isArray(
        productData,
      )
        ? productData
        : [];

      const normalizedServices = Array.isArray(
        serviceData,
      )
        ? serviceData
        : [];

      setSale(saleData);
      setCustomers(normalizedCustomers);
      setProducts(normalizedProducts);
      setServices(normalizedServices);

      const existingType: InvoiceType =
        saleData?.invoice_type === "tax"
          ? "tax"
          : saleData?.invoice_type ===
              "service_challan"
            ? "service_challan"
            : "normal";

      setInvoiceType(existingType);
      setSelectedCustomerId(
        saleData?.customer_id
          ? Number(saleData.customer_id)
          : "",
      );
      setSelectedServiceId(
        saleData?.service_id
          ? Number(saleData.service_id)
          : "",
      );
      setSaleDate(
        getDateInputValue(saleData?.sale_date),
      );
      setNotes(saleData?.notes ?? "");

      const existingItems: SaleItem[] =
        Array.isArray(saleData?.items)
          ? saleData.items
          : [];

      const productItems = existingItems.filter(
        (item) =>
          item.item_type === "product" ||
          (!item.item_type &&
            item.product_id &&
            !item.service_spare_id),
      );

      const spareItems = existingItems.filter(
        (item) =>
          item.item_type === "spare" ||
          Boolean(item.service_spare_id),
      );

      setProductRows(
        productItems.map((item) => ({
          product_id: item.product_id
            ? Number(item.product_id)
            : "",
          quantity: toNumber(item.quantity) || 1,
          rate: toNumber(item.rate),
          discount_amount: toNumber(
            item.discount_amount,
          ),
          gst_percent: toNumber(item.gst_percent),
        })),
      );

      setSpareRows(
        spareItems.map((item) => ({
          service_spare_id:
            item.service_spare_id
              ? Number(item.service_spare_id)
              : "",
          quantity: toNumber(item.quantity) || 1,
          rate: toNumber(item.rate),
          discount_amount: toNumber(
            item.discount_amount,
          ),
          gst_percent: toNumber(item.gst_percent),
          description:
            item.description ??
            item.product?.product_name ??
            "Service Spare",
        })),
      );

      /*
       * Tax invoice is considered to include service
       * charges when an existing service is attached
       * and the old sale has other charges.
       */
      if (
        existingType === "tax" &&
        saleData?.service_id &&
        toNumber(saleData?.other_charges) > 0
      ) {
        setIncludeServiceCharges(true);
      }
    } catch (err: any) {
      console.error("Sale Edit Load Error:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to load sale details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceTypeChange = (
    type: InvoiceType,
  ) => {
    setInvoiceType(type);

    if (type === "normal") {
      setSelectedServiceId("");
      setIncludeServiceCharges(false);
      setSpareRows([]);
    }

    if (type === "service_challan") {
      setProductRows([]);
      setSpareRows([]);
      setIncludeServiceCharges(false);
    }
  };

  const handleProductChange = (
    index: number,
    productId: number | "",
  ) => {
    setProductRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const product = products.find(
          (item) => item.id === Number(productId),
        );

        return {
          ...row,
          product_id: productId,
          rate: product
            ? toNumber(
                product.sale_price ??
                  product.selling_price,
              )
            : row.rate,
          gst_percent: isTax
            ? toNumber(product?.gst_percentage)
            : 0,
        };
      }),
    );
  };

  const handleProductFieldChange = (
    index: number,
    field:
      | "quantity"
      | "rate"
      | "discount_amount"
      | "gst_percent",
    value: string,
  ) => {
    setProductRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]:
                field === "gst_percent"
                  ? Number(value)
                  : Number(value),
            }
          : row,
      ),
    );
  };

  const addProductRow = () => {
    const firstProduct = products[0];

    setProductRows((current) => [
      ...current,
      {
        product_id: firstProduct?.id ?? "",
        quantity: 1,
        rate: firstProduct
          ? toNumber(
              firstProduct.sale_price ??
                firstProduct.selling_price,
            )
          : 0,
        discount_amount: 0,
        gst_percent: isTax
          ? toNumber(firstProduct?.gst_percentage)
          : 0,
      },
    ]);
  };

  const removeProductRow = (index: number) => {
    setProductRows((current) =>
      current.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    );
  };

  const addSpareRow = () => {
    const firstSpare = availableSpares[0];

    setSpareRows((current) => [
      ...current,
      {
        service_spare_id:
          firstSpare?.id ?? "",
        quantity:
          toNumber(firstSpare?.quantity) || 1,
        rate: toNumber(firstSpare?.rate),
        discount_amount: toNumber(
          firstSpare?.discount_amount,
        ),
        gst_percent: toNumber(
          firstSpare?.gst_percent,
        ),
        description:
          firstSpare?.product?.product_name ??
          "Service Spare",
      },
    ]);
  };

  const handleSpareChange = (
    index: number,
    spareId: number | "",
  ) => {
    setSpareRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const spare = availableSpares.find(
          (item) => item.id === Number(spareId),
        );

        return {
          ...row,
          service_spare_id: spareId,
          quantity:
            toNumber(spare?.quantity) || 1,
          rate: toNumber(spare?.rate),
          discount_amount: toNumber(
            spare?.discount_amount,
          ),
          gst_percent: toNumber(
            spare?.gst_percent,
          ),
          description:
            spare?.product?.product_name ??
            "Service Spare",
        };
      }),
    );
  };

  const handleSpareFieldChange = (
    index: number,
    field:
      | "quantity"
      | "rate"
      | "discount_amount"
      | "gst_percent",
    value: string,
  ) => {
    setSpareRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: Number(value),
            }
          : row,
      ),
    );
  };

  const removeSpareRow = (index: number) => {
    setSpareRows((current) =>
      current.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    );
  };

  const productTotals = useMemo(() => {
    return productRows.reduce(
      (summary, row) => {
        const gross =
          row.quantity * row.rate;

        const discount =
          Math.max(row.discount_amount, 0);

        const taxable = Math.max(
          gross - discount,
          0,
        );

        const gst =
          isTax
            ? taxable *
              (Math.max(row.gst_percent, 0) / 100)
            : 0;

        const total = taxable + gst;

        summary.subtotal += gross;
        summary.discount += discount;
        summary.taxable += taxable;
        summary.gst += gst;
        summary.total += total;

        return summary;
      },
      {
        subtotal: 0,
        discount: 0,
        taxable: 0,
        gst: 0,
        total: 0,
      },
    );
  }, [productRows, isTax]);

  const spareTotals = useMemo(() => {
    return spareRows.reduce(
      (summary, row) => {
        const gross =
          row.quantity * row.rate;

        const discount =
          Math.max(row.discount_amount, 0);

        const taxable = Math.max(
          gross - discount,
          0,
        );

        const gst =
          isTax
            ? taxable *
              (Math.max(row.gst_percent, 0) / 100)
            : 0;

        const total = taxable + gst;

        summary.subtotal += gross;
        summary.discount += discount;
        summary.taxable += taxable;
        summary.gst += gst;
        summary.total += total;

        return summary;
      },
      {
        subtotal: 0,
        discount: 0,
        taxable: 0,
        gst: 0,
        total: 0,
      },
    );
  }, [spareRows, isTax]);

  const serviceCharge = useMemo(() => {
    if (
      !isTax ||
      !includeServiceCharges ||
      !selectedService
    ) {
      return 0;
    }

    return (
      toNumber(selectedService.labour_charge) +
      toNumber(selectedService.other_charge)
    );
  }, [
    isTax,
    includeServiceCharges,
    selectedService,
  ]);

  const serviceChargeGST = useMemo(() => {
    if (
      !isTax ||
      !includeServiceCharges ||
      !selectedService
    ) {
      return 0;
    }

    const serviceGstPercent = toNumber(
      selectedService.gst_percent,
    );

    return (
      serviceCharge *
      (serviceGstPercent / 100)
    );
  }, [
    isTax,
    includeServiceCharges,
    selectedService,
    serviceCharge,
  ]);

  const challanCharges = useMemo(() => {
    if (!isChallan || !selectedService) {
      return {
        labour: 0,
        service: 0,
        total: 0,
      };
    }

    const labour = toNumber(
      selectedService.labour_charge,
    );

    const service = toNumber(
      selectedService.other_charge,
    );

    return {
      labour,
      service,
      total: labour + service,
    };
  }, [isChallan, selectedService]);

  const summary = useMemo(() => {
    if (isChallan) {
      const total =
        challanCharges.total;

      return {
        subtotal: total,
        discount: 0,
        taxable: total,
        gst: 0,
        otherCharges: 0,
        grandTotal: total,
      };
    }

    const subtotal =
      productTotals.subtotal +
      spareTotals.subtotal +
      serviceCharge;

    const discount =
      productTotals.discount +
      spareTotals.discount;

    const taxable =
      productTotals.taxable +
      spareTotals.taxable +
      serviceCharge;

    const gst =
      productTotals.gst +
      spareTotals.gst +
      serviceChargeGST;

    return {
      subtotal,
      discount,
      taxable,
      gst,
      otherCharges: 0,
      grandTotal: taxable + gst,
    };
  }, [
    isChallan,
    challanCharges,
    productTotals,
    spareTotals,
    serviceCharge,
    serviceChargeGST,
  ]);

  const validate = () => {
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return false;
    }

    if (!saleDate) {
      alert("Please select sale date.");
      return false;
    }

    if (isChallan) {
      if (!selectedServiceId) {
        alert(
          "Please select an existing service.",
        );
        return false;
      }

      return true;
    }

    if (productRows.length === 0) {
      alert("Please add at least one product.");
      return false;
    }

    for (const row of productRows) {
      if (!row.product_id) {
        alert("Please select product for all rows.");
        return false;
      }

      if (row.quantity <= 0) {
        alert("Product quantity must be greater than 0.");
        return false;
      }

      if (row.rate < 0) {
        alert("Product rate cannot be negative.");
        return false;
      }
    }

    if (isTax) {
      for (const row of spareRows) {
        if (!row.service_spare_id) {
          alert(
            "Please select service spare for all spare rows.",
          );
          return false;
        }

        if (row.quantity <= 0) {
          alert(
            "Spare quantity must be greater than 0.",
          );
          return false;
        }
      }

      if (
        includeServiceCharges &&
        !selectedServiceId
      ) {
        alert(
          "Please select service for service/labour charges.",
        );
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    if (isChallan) {
      return {
        invoice_type: "service_challan",
        customer_id: Number(selectedCustomerId),
        service_id: Number(selectedServiceId),
        sale_date: saleDate,
        items: [],
        include_service_charges: false,
        notes: notes.trim() || null,
      };
    }

    const items = [
      ...productRows.map((row) => ({
        product_id: Number(row.product_id),
        quantity: row.quantity,
        rate: row.rate,
        discount_amount: row.discount_amount,
        gst_percent: isTax
          ? row.gst_percent
          : 0,
        item_type: "product",
      })),
      ...(isTax
        ? spareRows.map((row) => ({
            service_spare_id:
              Number(row.service_spare_id),
            quantity: row.quantity,
            rate: row.rate,
            discount_amount:
              row.discount_amount,
            gst_percent:
              row.gst_percent,
            item_type: "spare",
            description: row.description,
          }))
        : []),
    ];

    return {
      invoice_type: invoiceType,
      customer_id: Number(selectedCustomerId),
      service_id:
        isTax &&
        includeServiceCharges &&
        selectedServiceId
          ? Number(selectedServiceId)
          : null,
      sale_date: saleDate,
      items,
      include_service_charges:
        isTax && includeServiceCharges,
      notes: notes.trim() || null,
    };
  };

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!sale) return;

    if (!validate()) return;

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();

      await api.put(
        `/sales/${sale.id}`,
        payload,
      );

      navigate(`/sales/${sale.id}`);
    } catch (err: any) {
      console.error(
        "Sale Update Error:",
        err,
      );

      const responseMessage =
        err?.response?.data?.message;

      const validationErrors =
        err?.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(
            validationErrors,
          )[0] as string[] | undefined;

        setError(
          firstError?.[0] ??
            responseMessage ??
            "Unable to update sale.",
        );
      } else {
        setError(
          responseMessage ??
            "Unable to update sale.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading sale...
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Sale not found."}
        </div>

        <button
          type="button"
          onClick={() => navigate("/sales")}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl"
      >
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/sales/${sale.id}`)
                }
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Edit Sale
                </h1>

                <p className="text-sm text-slate-500">
                  {sale.invoice_no}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(`/sales/${sale.id}`)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Sale
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Type */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">
              Billing Type
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                handleInvoiceTypeChange("normal")
              }
              className={`rounded-xl border p-4 text-left transition ${
                isNormal
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="font-semibold text-slate-800">
                Normal Invoice
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Product only · GST OFF
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleInvoiceTypeChange("tax")
              }
              className={`rounded-xl border p-4 text-left transition ${
                isTax
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="font-semibold text-slate-800">
                Tax Invoice
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Product + Spare + Service · GST ON
              </div>
            </button>

          </div>
        </div>

        {/* Basic Details */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">
            Invoice Details
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Invoice Number
              </label>

              <input
                value={sale.invoice_no}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Customer
              </label>

              <select
                value={selectedCustomerId}
                onChange={(event) =>
                  setSelectedCustomerId(
                    event.target.value
                      ? Number(event.target.value)
                      : "",
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select Customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.company_name}
                    {customer.customer_code
                      ? ` (${customer.customer_code})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Sale Date
              </label>

              <input
                type="date"
                value={saleDate}
                onChange={(event) =>
                  setSaleDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Service Challan */}
        {isChallan && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />

              <div>
                <h2 className="font-semibold text-slate-800">
                  Existing Service
                </h2>

                <p className="text-xs text-slate-500">
                  Service spares are not added again.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Service
                </label>

                <select
                  value={selectedServiceId}
                  onChange={(event) =>
                    setSelectedServiceId(
                      event.target.value
                        ? Number(event.target.value)
                        : "",
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">
                    Select Service
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.service_no
                        ? service.service_no
                        : `Service #${service.id}`}
                      {service.description
                        ? ` - ${service.description}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-orange-50 p-3">
                <div className="text-xs text-orange-700">
                  Labour Charge
                </div>
                <div className="mt-1 font-semibold text-orange-900">
                  ₹{" "}
                  {formatAmount(
                    challanCharges.labour,
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-orange-50 p-3">
                <div className="text-xs text-orange-700">
                  Service Charge
                </div>
                <div className="mt-1 font-semibold text-orange-900">
                  ₹{" "}
                  {formatAmount(
                    challanCharges.service,
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Service */}
        {isTax && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-600" />

              <h2 className="font-semibold text-slate-800">
                Service / Labour Charges
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Existing Service
                </label>

                <select
                  value={selectedServiceId}
                  onChange={(event) =>
                    setSelectedServiceId(
                      event.target.value
                        ? Number(event.target.value)
                        : "",
                    )
                  }
                  disabled={!includeServiceCharges}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                >
                  <option value="">
                    Select Service
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.service_no
                        ? service.service_no
                        : `Service #${service.id}`}
                      {service.description
                        ? ` - ${service.description}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeServiceCharges}
                  onChange={(event) => {
                    setIncludeServiceCharges(
                      event.target.checked,
                    );

                    if (!event.target.checked) {
                      setSelectedServiceId("");
                    }
                  }}
                  className="h-4 w-4"
                />

                Include Labour + Service Charge
              </label>
            </div>

            {includeServiceCharges &&
              selectedService && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">
                      Labour
                    </div>
                    <div className="font-semibold">
                      ₹{" "}
                      {formatAmount(
                        toNumber(
                          selectedService.labour_charge,
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">
                      Service
                    </div>
                    <div className="font-semibold">
                      ₹{" "}
                      {formatAmount(
                        toNumber(
                          selectedService.other_charge,
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-3">
                    <div className="text-xs text-emerald-700">
                      GST
                    </div>
                    <div className="font-semibold text-emerald-800">
                      ₹{" "}
                      {formatAmount(
                        serviceChargeGST,
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Products */}
        {!isChallan && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Products
                </h2>

                <p className="text-xs text-slate-500">
                  {isNormal
                    ? "GST disabled for Normal Invoice."
                    : "GST enabled for Tax Invoice."}
                </p>
              </div>

              <button
                type="button"
                onClick={addProductRow}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">
                      Product
                    </th>
                    <th className="px-3 py-3">
                      Qty
                    </th>
                    <th className="px-3 py-3">
                      Rate
                    </th>
                    <th className="px-3 py-3">
                      Discount
                    </th>

                    {isTax && (
                      <th className="px-3 py-3">
                        GST %
                      </th>
                    )}

                    <th className="px-3 py-3 text-right">
                      Total
                    </th>

                    <th className="px-3 py-3 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {productRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isTax ? 7 : 6}
                        className="px-3 py-8 text-center text-slate-400"
                      >
                        No products added.
                      </td>
                    </tr>
                  ) : (
                    productRows.map(
                      (row, index) => {
                        const gross =
                          row.quantity *
                          row.rate;

                        const taxable =
                          Math.max(
                            gross -
                              row.discount_amount,
                            0,
                          );

                        const gst =
                          isTax
                            ? taxable *
                              (row.gst_percent /
                                100)
                            : 0;

                        const total =
                          taxable + gst;

                        return (
                          <tr
                            key={index}
                            className="border-b border-slate-100"
                          >
                            <td className="px-3 py-3">
                              <select
                                value={
                                  row.product_id
                                }
                                onChange={(event) =>
                                  handleProductChange(
                                    index,
                                    event.target.value
                                      ? Number(
                                          event.target
                                            .value,
                                        )
                                      : "",
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                              >
                                <option value="">
                                  Select Product
                                </option>

                                {products.map(
                                  (product) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {
                                        product.product_name
                                      }
                                      {product.product_code
                                        ? ` (${product.product_code})`
                                        : ""}
                                    </option>
                                  ),
                                )}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={
                                  row.quantity
                                }
                                onChange={(event) =>
                                  handleProductFieldChange(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.rate}
                                onChange={(event) =>
                                  handleProductFieldChange(
                                    index,
                                    "rate",
                                    event.target.value,
                                  )
                                }
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  row.discount_amount
                                }
                                onChange={(event) =>
                                  handleProductFieldChange(
                                    index,
                                    "discount_amount",
                                    event.target.value,
                                  )
                                }
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            {isTax && (
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    row.gst_percent
                                  }
                                  onChange={(event) =>
                                    handleProductFieldChange(
                                      index,
                                      "gst_percent",
                                      event.target
                                        .value,
                                    )
                                  }
                                  className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                                />
                              </td>
                            )}

                            <td className="px-3 py-3 text-right font-semibold">
                              ₹{" "}
                              {formatAmount(
                                total,
                              )}
                            </td>

                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeProductRow(
                                    index,
                                  )
                                }
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Spares */}
        {isTax && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Service Spares
                </h2>

                <p className="text-xs text-slate-500">
                  Existing ServiceSpare records are reused.
                  Stock is not deducted again here.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!selectedServiceId) {
                    alert(
                      "Select a service before adding spares.",
                    );
                    return;
                  }

                  if (
                    availableSpares.length === 0
                  ) {
                    alert(
                      "No service spares available for this service.",
                    );
                    return;
                  }

                  addSpareRow();
                }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Spare
              </button>
            </div>

            {spareRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                No service spares added.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">
                        Spare
                      </th>
                      <th className="px-3 py-3">
                        Qty
                      </th>
                      <th className="px-3 py-3">
                        Rate
                      </th>
                      <th className="px-3 py-3">
                        Discount
                      </th>
                      <th className="px-3 py-3">
                        GST %
                      </th>
                      <th className="px-3 py-3 text-right">
                        Total
                      </th>
                      <th className="px-3 py-3 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {spareRows.map(
                      (row, index) => {
                        const gross =
                          row.quantity *
                          row.rate;

                        const taxable =
                          Math.max(
                            gross -
                              row.discount_amount,
                            0,
                          );

                        const gst =
                          taxable *
                          (row.gst_percent /
                            100);

                        const total =
                          taxable + gst;

                        return (
                          <tr
                            key={index}
                            className="border-b border-slate-100"
                          >
                            <td className="px-3 py-3">
                              <select
                                value={
                                  row.service_spare_id
                                }
                                onChange={(event) =>
                                  handleSpareChange(
                                    index,
                                    event.target
                                      .value
                                      ? Number(
                                          event.target
                                            .value,
                                        )
                                      : "",
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                              >
                                <option value="">
                                  Select Spare
                                </option>

                                {availableSpares.map(
                                  (spare) => (
                                    <option
                                      key={
                                        spare.id
                                      }
                                      value={
                                        spare.id
                                      }
                                    >
                                      {spare.product
                                        ?.product_name ??
                                        `Spare #${spare.id}`}
                                    </option>
                                  ),
                                )}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={
                                  row.quantity
                                }
                                onChange={(event) =>
                                  handleSpareFieldChange(
                                    index,
                                    "quantity",
                                    event.target
                                      .value,
                                  )
                                }
                                className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.rate}
                                onChange={(event) =>
                                  handleSpareFieldChange(
                                    index,
                                    "rate",
                                    event.target
                                      .value,
                                  )
                                }
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  row.discount_amount
                                }
                                onChange={(event) =>
                                  handleSpareFieldChange(
                                    index,
                                    "discount_amount",
                                    event.target
                                      .value,
                                  )
                                }
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  row.gst_percent
                                }
                                onChange={(event) =>
                                  handleSpareFieldChange(
                                    index,
                                    "gst_percent",
                                    event.target
                                      .value,
                                  )
                                }
                                className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>

                            <td className="px-3 py-3 text-right font-semibold">
                              ₹{" "}
                              {formatAmount(
                                total,
                              )}
                            </td>

                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeSpareRow(
                                    index,
                                  )
                                }
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Notes
          </label>

          <textarea
            rows={4}
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Enter invoice notes..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">
              Current Invoice
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Invoice Number
                </div>
                <div className="mt-1 font-bold text-slate-800">
                  {sale.invoice_no}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Billing Type
                </div>
                <div className="mt-1 font-bold text-slate-800">
                  {isNormal ? "Normal Invoice" : "Tax Invoice"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Existing Paid
                </div>
                <div className="mt-1 font-bold text-slate-800">
                  ₹{" "}
                  {formatAmount(
                    toNumber(
                      sale.paid_amount,
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Existing Payment Status
                </div>
                <div className="mt-1 font-bold capitalize text-slate-800">
                  {sale.payment_status ||
                    "Pending"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">
              Updated Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Subtotal
                </span>
                <span className="font-medium">
                  ₹{" "}
                  {formatAmount(
                    summary.subtotal,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Discount
                </span>
                <span className="font-medium">
                  ₹{" "}
                  {formatAmount(
                    summary.discount,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Taxable Amount
                </span>
                <span className="font-medium">
                  ₹{" "}
                  {formatAmount(
                    summary.taxable,
                  )}
                </span>
              </div>

              {isTax && (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    GST
                  </span>
                  <span className="font-medium">
                    ₹{" "}
                    {formatAmount(
                      summary.gst,
                    )}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Grand Total
                  </span>

                  <span className="text-xl font-bold text-blue-700">
                    ₹{" "}
                    {formatAmount(
                      summary.grandTotal,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() =>
              navigate(`/sales/${sale.id}`)
            }
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Sale
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}