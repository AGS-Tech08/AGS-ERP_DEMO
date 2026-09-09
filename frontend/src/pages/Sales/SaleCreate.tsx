import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type InvoiceType = "normal" | "tax" | "service_challan";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
  state?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  hsn_code?: string;
  sale_price?: number | string;
  selling_price?: number | string;
  price?: number | string;
  stock?: number | string;
  gst_percent?: number | string;
}

interface Service {
  id: number;
  service_no?: string;
  name?: string;
  title?: string;
  customer_id?: number;
  labour_charge?: number | string;
  other_charge?: number | string;
  service_charge?: number | string;
  grand_total?: number | string;
  status?: string;
}

interface ServiceSpare {
  id: number;
  service_id: number;
  product_id?: number;
  product?: Product;
  quantity?: number | string;
  rate?: number | string;
  total_amount?: number | string;
}

interface SaleItem {
  product_id?: number;
  service_spare_id?: number;
  item_type: "product" | "spare" | "service";
  description?: string;
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
}

const money = (value: number) => Number(value || 0).toFixed(2);

const num = (value: unknown) => Number(value || 0);

/**
 * API response -> array
 *
 * Handles:
 * []
 * { data: [] }
 * { customers: [] }
 * { products: [] }
 * { services: [] }
 * { data: { data: [] } }
 */
function extractArray<T>(
  responseData: any,
  keys: string[] = []
): T[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  for (const key of keys) {
    if (Array.isArray(responseData?.[key])) {
      return responseData[key];
    }
  }

  if (
    responseData?.data &&
    typeof responseData.data === "object"
  ) {
    if (Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }

    for (const key of keys) {
      if (Array.isArray(responseData.data[key])) {
        return responseData.data[key];
      }
    }
  }

  return [];
}

/**
 * Normalize Customer master data
 */
function normalizeCustomer(raw: any): Customer {
  return {
    id: Number(raw?.id),

    name:
      raw?.name ||
      raw?.company_name ||
      raw?.customer_name ||
      raw?.contact_person ||
      `Customer #${raw?.id}`,

    phone:
      raw?.phone ||
      raw?.mobile ||
      raw?.mobile_number ||
      "",

    gstin:
      raw?.gstin ||
      raw?.gst_number ||
      raw?.gst_no ||
      "",

    address:
      raw?.address ||
      raw?.billing_address ||
      "",

    state:
      raw?.state ||
      raw?.state_name ||
      "",
  };
}

/**
 * Normalize Product master data
 */
function normalizeProduct(raw: any): Product {
  return {
    id: Number(raw?.id),

    name:
      raw?.name ||
      raw?.product_name ||
      raw?.item_name ||
      `Product #${raw?.id}`,

    sku:
      raw?.sku ||
      raw?.product_code ||
      raw?.code ||
      "",

    hsn_code:
      raw?.hsn_code ||
      raw?.hsn_sac ||
      raw?.hsn ||
      "",

    sale_price:
      raw?.sale_price ??
      raw?.selling_price ??
      raw?.price ??
      raw?.unit_price ??
      0,

    selling_price:
      raw?.selling_price ??
      raw?.sale_price ??
      raw?.price ??
      0,

    price:
      raw?.price ??
      raw?.sale_price ??
      raw?.selling_price ??
      0,

    stock:
      raw?.stock ??
      raw?.current_stock ??
      raw?.quantity ??
      0,

    gst_percent:
      raw?.gst_percent ??
      raw?.gst_percentage ??
      raw?.tax_percent ??
      raw?.gst_rate ??
      0,
  };
}

/**
 * Normalize Service master data
 */
function normalizeService(raw: any): Service {
  return {
    id: Number(raw?.id),

    service_no:
      raw?.service_no ||
      raw?.service_number ||
      raw?.service_code ||
      "",

    name:
      raw?.name ||
      raw?.service_name ||
      raw?.title ||
      raw?.description ||
      `Service #${raw?.id}`,

    title:
      raw?.title ||
      raw?.service_name ||
      raw?.name ||
      "",

    customer_id:
      raw?.customer_id != null
        ? Number(raw.customer_id)
        : undefined,

    labour_charge:
      raw?.labour_charge ??
      raw?.labor_charge ??
      0,

    other_charge:
      raw?.other_charge ??
      raw?.service_charge ??
      0,

    service_charge:
      raw?.service_charge ??
      raw?.other_charge ??
      0,

    grand_total:
      raw?.grand_total ??
      raw?.total_amount ??
      0,

    status:
      raw?.status ||
      "",
  };
}

export default function SaleCreate() {
  const navigate = useNavigate();

  const [invoiceType, setInvoiceType] =
    useState<InvoiceType>("normal");

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [serviceSpares, setServiceSpares] =
    useState<ServiceSpare[]>([]);

  const [customerId, setCustomerId] =
    useState("");

  const [serviceId, setServiceId] =
    useState("");

  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [notes, setNotes] = useState("");

  const [items, setItems] =
    useState<SaleItem[]>([]);

  const [includeServiceCharges, setIncludeServiceCharges] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        customersResponse,
        productsResponse,
        servicesResponse,
      ] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
        api.get("/services"),
      ]);

      const customerData = extractArray<any>(
        customersResponse.data,
        ["customers"]
      );

      const productData = extractArray<any>(
        productsResponse.data,
        ["products"]
      );

      const serviceData = extractArray<any>(
        servicesResponse.data,
        ["services"]
      );

      setCustomers(
        customerData
          .map(normalizeCustomer)
          .filter((item) => item.id > 0)
      );

      setProducts(
        productData
          .map(normalizeProduct)
          .filter((item) => item.id > 0)
      );

      setServices(
        serviceData
          .map(normalizeService)
          .filter((item) => item.id > 0)
      );
    } catch (err: any) {
      console.error(
        "SaleCreate loadData error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load sales data."
      );

      setCustomers([]);
      setProducts([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = useMemo(
    () => {
      if (!Array.isArray(customers)) {
        return undefined;
      }

      return customers.find(
        (customer) =>
          String(customer.id) ===
          String(customerId)
      );
    },
    [customers, customerId]
  );

  const selectedService = useMemo(
    () => {
      if (!Array.isArray(services)) {
        return undefined;
      }

      return services.find(
        (service) =>
          String(service.id) ===
          String(serviceId)
      );
    },
    [services, serviceId]
  );

  const loadServiceSpares = async (
    id: string
  ) => {
    if (!id) {
      setServiceSpares([]);
      return;
    }

    try {
      const response = await api.get(
        `/services/${id}/spares`
      );

      const data = extractArray<any>(
        response.data,
        ["spares", "service_spares"]
      );

      const normalized = data.map(
        (raw: any): ServiceSpare => ({
          id: Number(raw?.id),

          service_id:
            Number(raw?.service_id) ||
            Number(id),

          product_id:
            raw?.product_id != null
              ? Number(raw.product_id)
              : undefined,

          product: raw?.product
            ? normalizeProduct(raw.product)
            : undefined,

          quantity:
            raw?.quantity ??
            raw?.qty ??
            1,

          rate:
            raw?.rate ??
            raw?.unit_price ??
            raw?.price ??
            0,

          total_amount:
            raw?.total_amount ??
            raw?.total ??
            0,
        })
      );

      setServiceSpares(normalized);
    } catch (err) {
      console.error(
        "Unable to load service spares:",
        err
      );

      setServiceSpares([]);
    }
  };

  const changeInvoiceType = (
    type: InvoiceType
  ) => {
    setInvoiceType(type);
    setItems([]);
    setIncludeServiceCharges(false);

    if (type !== "service_challan") {
      setServiceId("");
      setServiceSpares([]);
    }
  };

  const addProduct = () => {
    if (!Array.isArray(products) || !products.length) {
      setError(
        "No products available. Please check Product Master."
      );
      return;
    }

    setError("");

    const product = products[0];

    setItems((current) => [
      ...current,
      {
        product_id: product.id,

        item_type: "product",

        quantity: 1,

        rate:
          num(product.sale_price) ||
          num(product.selling_price) ||
          num(product.price),

        discount_amount: 0,

        gst_percent:
          invoiceType === "tax"
            ? num(product.gst_percent)
            : 0,

        description: product.name,
      },
    ]);
  };

  const addSpare = (
    spare: ServiceSpare
  ) => {
    const product = spare.product;

    setItems((current) => [
      ...current,
      {
        product_id:
          spare.product_id,

        service_spare_id:
          spare.id,

        item_type: "spare",

        quantity:
          num(spare.quantity) || 1,

        rate:
          num(spare.rate) ||
          num(product?.sale_price) ||
          num(product?.selling_price) ||
          num(product?.price),

        discount_amount: 0,

        gst_percent:
          num(product?.gst_percent),

        description:
          product?.name ||
          `Spare #${spare.id}`,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof SaleItem,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,

          [field]:
            field === "quantity" ||
            field === "rate" ||
            field === "discount_amount" ||
            field === "gst_percent"
              ? Number(value)
              : value,
        };
      })
    );
  };

  const removeItem = (
    index: number
  ) => {
    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const productSubtotal =
    items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          item.quantity * item.rate -
            item.discount_amount,
          0
        ),
      0
    );

  const totalDiscount =
    items.reduce(
      (sum, item) =>
        sum + Math.max(item.discount_amount, 0),
      0
    );

  const productTaxable =
    Math.max(productSubtotal, 0);

  const gstAmount =
    invoiceType === "tax"
      ? items.reduce(
          (sum, item) => {
            const taxable =
              Math.max(
                item.quantity *
                  item.rate -
                  item.discount_amount,
                0
              );

            return (
              sum +
              taxable *
                (item.gst_percent / 100)
            );
          },
          0
        )
      : 0;

  const labourCharge =
    invoiceType === "service_challan"
      ? num(
          selectedService?.labour_charge
        )
      : invoiceType === "tax" &&
          includeServiceCharges
        ? num(
            selectedService?.labour_charge
          )
        : 0;

  const serviceCharge =
    invoiceType === "service_challan"
      ? num(
          selectedService?.other_charge
        ) ||
        num(
          selectedService?.service_charge
        )
      : invoiceType === "tax" &&
          includeServiceCharges
        ? num(
            selectedService?.other_charge
          ) ||
          num(
            selectedService?.service_charge
          )
        : 0;

  const taxableTotal =
    productTaxable +
    labourCharge +
    serviceCharge;

  const grandTotal =
    invoiceType === "tax"
      ? taxableTotal + gstAmount
      : taxableTotal;

  const handleServiceChange =
    async (value: string) => {
      setServiceId(value);

      const service = Array.isArray(
        services
      )
        ? services.find(
            (item) =>
              String(item.id) ===
              String(value)
          )
        : undefined;

      if (service?.customer_id) {
        setCustomerId(
          String(service.customer_id)
        );
      }

      await loadServiceSpares(value);
    };

  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!customerId) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (
      invoiceType ===
        "service_challan" &&
      !serviceId
    ) {
      setError(
        "Please select a service."
      );
      return;
    }

    if (
      invoiceType !==
        "service_challan" &&
      items.length === 0
    ) {
      setError(
        "Please add at least one product."
      );
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        invoice_type: invoiceType,

        customer_id:
          Number(customerId),

        sale_date: saleDate,

        notes,

        items:
          invoiceType ===
          "service_challan"
            ? []
            : items.map((item) => ({
                product_id:
                  item.product_id,

                service_spare_id:
                  item.service_spare_id,

                item_type:
                  item.item_type,

                description:
                  item.description,

                quantity:
                  item.quantity,

                rate:
                  item.rate,

                discount_amount:
                  item.discount_amount,

                gst_percent:
                  invoiceType === "tax"
                    ? item.gst_percent
                    : 0,
              })),
      };

      if (
        invoiceType ===
        "service_challan"
      ) {
        payload.service_id =
          Number(serviceId);
      }

      if (
        invoiceType === "tax"
      ) {
        payload.include_service_charges =
          includeServiceCharges;

        if (
          includeServiceCharges
        ) {
          if (!serviceId) {
            setError(
              "Please select a service to include service charges."
            );

            setSaving(false);
            return;
          }

          payload.service_id =
            Number(serviceId);
        }
      }

      await api.post(
        "/sales",
        payload
      );

      navigate("/sales");
    } catch (err: any) {
      console.error(
        "Create sale error:",
        err
      );

      const responseErrors =
        err?.response?.data?.errors;

      if (responseErrors) {
        const firstError =
          Object.values(
            responseErrors
          )[0] as
            | string[]
            | undefined;

        setError(
          firstError?.[0] ||
            err?.response?.data
              ?.message ||
            "Unable to create sale."
        );
      } else {
        setError(
          err?.response?.data
            ?.message ||
            "Unable to create sale."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">
          Loading sales...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Sale
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create Normal Invoice or Tax Invoice.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/sales")
          }
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Sales
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-6"
      >
        {/* Billing Type */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Billing Type
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <BillingCard
              active={
                invoiceType === "normal"
              }
              title="Normal Invoice"
              description="Product sale without GST"
              onClick={() =>
                changeInvoiceType(
                  "normal"
                )
              }
            />

            <BillingCard
              active={
                invoiceType === "tax"
              }
              title="Tax Invoice"
              description="GST invoice with products, spares & services"
              onClick={() =>
                changeInvoiceType(
                  "tax"
                )
              }
            />

          </div>
        </div>

        {/* Customer / Date */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(e) =>
                  setCustomerId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select customer
                </option>

                {Array.isArray(
                  customers
                ) &&
                  customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}
                        {customer.phone
                          ? ` - ${customer.phone}`
                          : ""}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sale Date
              </label>

              <input
                type="date"
                value={saleDate}
                onChange={(e) =>
                  setSaleDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {selectedCustomer && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-900">
                  {
                    selectedCustomer.name
                  }
                </div>

                {selectedCustomer.gstin && (
                  <div className="text-slate-500">
                    GSTIN:{" "}
                    {
                      selectedCustomer.gstin
                    }
                  </div>
                )}

                {selectedCustomer.state && (
                  <div className="text-slate-500">
                    State:{" "}
                    {
                      selectedCustomer.state
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Service Challan */}
        {invoiceType ===
          "service_challan" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Service Details
            </h2>

            <select
              value={serviceId}
              onChange={(e) =>
                handleServiceChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Select existing service
              </option>

              {Array.isArray(
                services
              ) &&
                services.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.service_no
                        ? `${service.service_no} - `
                        : ""}
                      {service.name ||
                        service.title ||
                        `Service #${service.id}`}
                    </option>
                  )
                )}
            </select>

            {selectedService && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ChargeBox
                  label="Labour Charge"
                  value={
                    labourCharge
                  }
                />

                <ChargeBox
                  label="Service Charge"
                  value={
                    serviceCharge
                  }
                />

                <ChargeBox
                  label="Total"
                  value={
                    grandTotal
                  }
                />
              </div>
            )}

            <p className="mt-4 text-xs text-blue-700">
              Service Challan does not add
              spare items and does not deduct
              spare stock again.
            </p>
          </div>
        )}

        {/* Tax Invoice Service */}
        {invoiceType === "tax" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <input
                id="include-service"
                type="checkbox"
                checked={
                  includeServiceCharges
                }
                onChange={(e) =>
                  setIncludeServiceCharges(
                    e.target.checked
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <div>
                <label
                  htmlFor="include-service"
                  className="font-medium text-slate-900"
                >
                  Include Service / Labour
                  Charges
                </label>

                <p className="mt-1 text-xs text-slate-600">
                  Use this when an existing
                  service needs to be billed
                  together with GST.
                </p>
              </div>
            </div>

            {includeServiceCharges && (
              <div className="mt-4">
                <select
                  value={serviceId}
                  onChange={(e) =>
                    handleServiceChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select existing service
                  </option>

                  {Array.isArray(
                    services
                  ) &&
                    services.map(
                      (service) => (
                        <option
                          key={service.id}
                          value={
                            service.id
                          }
                        >
                          {service.service_no
                            ? `${service.service_no} - `
                            : ""}
                          {service.name ||
                            service.title ||
                            `Service #${service.id}`}
                        </option>
                      )
                    )}
                </select>

                {selectedService && (
                  <div className="mt-3 flex gap-6 text-sm">
                    <span>
                      Labour:{" "}
                      <b>
                        ₹
                        {money(
                          labourCharge
                        )}
                      </b>
                    </span>

                    <span>
                      Service:{" "}
                      <b>
                        ₹
                        {money(
                          serviceCharge
                        )}
                      </b>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Product Items */}
        {invoiceType !==
          "service_challan" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Products
                </h2>

                <p className="text-xs text-slate-500">
                  {invoiceType ===
                  "tax"
                    ? "Products and service spares can be billed with GST."
                    : "Products only. GST is disabled."}
                </p>
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Product
                    </th>

                    <th className="px-4 py-3">
                      Qty
                    </th>

                    <th className="px-4 py-3">
                      Rate
                    </th>

                    <th className="px-4 py-3">
                      Discount
                    </th>

                    {invoiceType ===
                      "tax" && (
                      <th className="px-4 py-3">
                        GST %
                      </th>
                    )}

                    <th className="px-4 py-3">
                      Total
                    </th>

                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map(
                    (
                      item,
                      index
                    ) => {
                      const total =
                        Math.max(
                          item.quantity *
                            item.rate -
                            item.discount_amount,
                          0
                        );

                      return (
                        <tr
                          key={`${item.item_type}-${index}`}
                        >
                          <td className="px-4 py-3">
                            <select
                              value={
                                item.product_id ??
                                ""
                              }
                              onChange={(
                                e
                              ) => {
                                const product =
                                  Array.isArray(
                                    products
                                  )
                                    ? products.find(
                                        (p) =>
                                          String(
                                            p.id
                                          ) ===
                                          e
                                            .target
                                            .value
                                      )
                                    : undefined;

                                updateItem(
                                  index,
                                  "product_id",
                                  Number(
                                    e.target
                                      .value
                                  )
                                );

                                if (
                                  product
                                ) {
                                  updateItem(
                                    index,
                                    "description",
                                    product.name
                                  );

                                  updateItem(
                                    index,
                                    "rate",
                                    num(
                                      product.sale_price
                                    ) ||
                                      num(
                                        product.selling_price
                                      ) ||
                                      num(
                                        product.price
                                      )
                                  );

                                  updateItem(
                                    index,
                                    "gst_percent",
                                    invoiceType ===
                                      "tax"
                                      ? num(
                                          product.gst_percent
                                        )
                                      : 0
                                  );
                                }
                              }}
                              className="min-w-[220px] rounded-lg border border-slate-300 px-3 py-2"
                            >
                              <option value="">
                                Select product
                              </option>

                              {Array.isArray(
                                products
                              ) &&
                                products.map(
                                  (
                                    product
                                  ) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {
                                        product.name
                                      }

                                      {product.sku
                                        ? ` (${product.sku})`
                                        : ""}
                                    </option>
                                  )
                                )}
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={
                                item.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  e.target
                                    .value
                                )
                              }
                              className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.rate
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "rate",
                                  e.target
                                    .value
                                )
                              }
                              className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.discount_amount
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "discount_amount",
                                  e.target
                                    .value
                                )
                              }
                              className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>

                          {invoiceType ===
                            "tax" && (
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.gst_percent
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItem(
                                    index,
                                    "gst_percent",
                                    e.target
                                      .value
                                  )
                                }
                                className="w-20 rounded-lg border border-slate-300 px-3 py-2"
                              />
                            </td>
                          )}

                          <td className="px-4 py-3 font-medium">
                            ₹
                            {money(
                              total
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {items.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          invoiceType ===
                          "tax"
                            ? 7
                            : 6
                        }
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        No products added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Spares */}
        {invoiceType ===
          "tax" &&
          includeServiceCharges &&
          serviceId && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900">
                  Service Spares
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Existing service spares
                  can be included in the Tax
                  Invoice.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {serviceSpares.length ===
                  0 && (
                  <div className="p-5 text-sm text-slate-400">
                    No service spares found.
                  </div>
                )}

                {serviceSpares.map(
                  (spare) => (
                    <div
                      key={spare.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {spare.product
                            ?.name ||
                            `Spare #${spare.id}`}
                        </div>

                        <div className="text-xs text-slate-500">
                          Qty:{" "}
                          {num(
                            spare.quantity
                          )}
                          {" · "}
                          Rate: ₹
                          {money(
                            num(
                              spare.rate
                            )
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addSpare(
                            spare
                          )
                        }
                        className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Add to Invoice
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Notes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Notes
          </label>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Bill Summary
            </h2>

            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                value={
                  productSubtotal
                }
              />

              <SummaryRow
                label="Discount"
                value={
                  totalDiscount
                }
              />

              {labourCharge >
                0 && (
                <SummaryRow
                  label="Labour Charge"
                  value={
                    labourCharge
                  }
                />
              )}

              {serviceCharge >
                0 && (
                <SummaryRow
                  label="Service Charge"
                  value={
                    serviceCharge
                  }
                />
              )}

              {invoiceType ===
                "tax" && (
                <SummaryRow
                  label="GST"
                  value={
                    gstAmount
                  }
                />
              )}

              <div className="border-t border-slate-200 pt-3">
                <SummaryRow
                  label="Grand Total"
                  value={
                    grandTotal
                  }
                  bold
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Creating..."
                : "Create Sale"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function BillingCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-5 text-left transition ${
        active
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">
          {title}
        </span>

        {active && (
          <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
            Selected
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </button>
  );
}

function ChargeBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-900">
        ₹{money(value)}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold
          ? "text-lg font-bold text-slate-900"
          : "text-slate-600"
      }`}
    >
      <span>{label}</span>

      <span>₹{money(value)}</span>
    </div>
  );
}