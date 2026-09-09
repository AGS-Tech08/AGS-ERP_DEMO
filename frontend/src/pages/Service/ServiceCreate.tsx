import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Customer {
  id: number;
  name: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  mobile?: string;
  gstin?: string;
  state?: string;
}

interface Asset {
  id: number;
  asset_name?: string;
  name?: string;
  device_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  customer_id?: number;
}

interface Technician {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
}

interface ServiceForm {
  customer_id: string;
  asset_id: string;

  service_type: string;

  entry_date: string;
  expected_delivery_date: string;

  contact_person: string;
  phone: string;

  device_type: string;
  brand: string;
  model: string;
  serial_number: string;

  accessories: string[];

  customer_complaint: string;
  technician_diagnosis: string;
  work_done: string;
  final_remarks: string;

  labour_charge: string;
  other_charge: string;
  discount_amount: string;
  gst_percent: string;
  paid_amount: string;

  technician_id: string;
  priority: string;
  remarks: string;
}

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const emptyForm: ServiceForm = {
  customer_id: "",
  asset_id: "",

  service_type: "repair",

  entry_date: getToday(),
  expected_delivery_date: "",

  contact_person: "",
  phone: "",

  device_type: "",
  brand: "",
  model: "",
  serial_number: "",

  accessories: [],

  customer_complaint: "",
  technician_diagnosis: "",
  work_done: "",
  final_remarks: "",

  labour_charge: "0",
  other_charge: "0",
  discount_amount: "0",
  gst_percent: "0",
  paid_amount: "0",

  technician_id: "",

  priority: "medium",

  remarks: "",
};

function extractArray<T = any>(
  response: any,
  keys: string[] = []
): T[] {
  const root = response?.data ?? response;

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root?.data)) {
    return root.data;
  }

  for (const key of keys) {
    if (Array.isArray(root?.[key])) {
      return root[key];
    }

    if (Array.isArray(root?.data?.[key])) {
      return root.data[key];
    }
  }

  return [];
}

function normalizeCustomer(item: any): Customer {
  return {
    id: Number(item.id),

    name:
      item.name ||
      item.company_name ||
      item.customer_name ||
      item.contact_person ||
      `Customer #${item.id}`,

    company_name:
      item.company_name || "",

    contact_person:
      item.contact_person ||
      item.contact_name ||
      item.name ||
      "",

    phone:
      item.phone ||
      item.mobile ||
      item.mobile_number ||
      item.phone_number ||
      "",

    mobile:
      item.mobile ||
      item.mobile_number ||
      "",

    gstin:
      item.gstin ||
      item.gst_number ||
      item.gst_no ||
      "",

    state:
      item.state ||
      item.state_name ||
      "",
  };
}

function normalizeAsset(item: any): Asset {
  return {
    id: Number(item.id),

    asset_name:
      item.asset_name ||
      item.name ||
      item.asset_number ||
      "",

    name:
      item.name || "",

    device_type:
      item.device_type ||
      item.type ||
      "",

    brand:
      item.brand ||
      item.brand_name ||
      "",

    model:
      item.model ||
      item.model_number ||
      "",

    serial_number:
      item.serial_number ||
      item.serial_no ||
      item.serial ||
      "",

    customer_id:
      item.customer_id != null
        ? Number(item.customer_id)
        : undefined,
  };
}

function normalizeTechnician(item: any): Technician {
  const fullName = [
    item.first_name,
    item.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: Number(item.id),

    name:
      item.name ||
      fullName ||
      `Employee #${item.id}`,

    first_name: item.first_name,
    last_name: item.last_name,
  };
}

export default function ServiceCreate() {
  const navigate = useNavigate();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [technicians, setTechnicians] =
    useState<Technician[]>([]);

  const [form, setForm] =
    useState<ServiceForm>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [loadingAssets, setLoadingAssets] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [accessoryInput, setAccessoryInput] =
    useState("");

  const updateField = (
    field: keyof ServiceForm,
    value: any
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // --------------------------------------------------
  // LOAD CUSTOMERS + EMPLOYEES
  // --------------------------------------------------

  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          customerResponse,
          employeeResponse,
        ] = await Promise.all([
          api.get("/customers"),
          api.get("/employees", {
            params: {
              per_page: 1000,
            },
          }),
        ]);

        const customerList =
          extractArray<any>(
            customerResponse,
            [
              "customers",
              "data",
              "results",
            ]
          )
            .map(normalizeCustomer)
            .filter(
              (customer) =>
                customer.id > 0
            );

        const employeeList =
          extractArray<any>(
            employeeResponse,
            [
              "employees",
              "data",
              "results",
            ]
          )
            .map(normalizeTechnician)
            .filter(
              (employee) =>
                employee.id > 0
            );

        setCustomers(customerList);
        setTechnicians(employeeList);
      } catch (err: any) {
        console.error(
          "Master data error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  // --------------------------------------------------
  // LOAD CUSTOMER ASSETS
  // --------------------------------------------------

  const loadCustomerAssets = async (
    customerId: string
  ) => {
    if (!customerId) {
      setAssets([]);
      return;
    }

    setLoadingAssets(true);

    try {
      let response;

      try {
        response = await api.get(
          `/customers/${customerId}/assets`
        );
      } catch {
        response = await api.get(
          "/assets",
          {
            params: {
              customer_id:
                customerId,
              per_page: 1000,
            },
          }
        );
      }

      const assetList =
        extractArray<any>(
          response,
          [
            "assets",
            "data",
            "results",
          ]
        )
          .map(normalizeAsset)
          .filter((asset) => {
            if (!asset.id) {
              return false;
            }

            if (
              asset.customer_id == null
            ) {
              return true;
            }

            return (
              asset.customer_id ===
              Number(customerId)
            );
          });

      setAssets(assetList);
    } catch (err) {
      console.error(
        "Asset loading error:",
        err
      );

      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // --------------------------------------------------
  // CUSTOMER CHANGE
  // --------------------------------------------------

  const handleCustomerChange = async (
    customerId: string
  ) => {
    const selectedCustomer =
      customers.find(
        (customer) =>
          String(customer.id) ===
          String(customerId)
      );

    setForm((previous) => ({
      ...previous,

      customer_id: customerId,

      asset_id: "",

      contact_person:
        selectedCustomer?.contact_person ||
        selectedCustomer?.name ||
        "",

      phone:
        selectedCustomer?.phone ||
        selectedCustomer?.mobile ||
        "",
    }));

    setAssets([]);

    await loadCustomerAssets(
      customerId
    );
  };

  // --------------------------------------------------
  // ASSET CHANGE
  // --------------------------------------------------

  const handleAssetChange = (
    assetId: string
  ) => {
    const selectedAsset =
      assets.find(
        (asset) =>
          String(asset.id) ===
          String(assetId)
      );

    setForm((previous) => ({
      ...previous,

      asset_id: assetId,

      device_type:
        selectedAsset?.device_type ||
        previous.device_type,

      brand:
        selectedAsset?.brand ||
        previous.brand,

      model:
        selectedAsset?.model ||
        previous.model,

      serial_number:
        selectedAsset?.serial_number ||
        previous.serial_number,
    }));
  };

  // --------------------------------------------------
  // ACCESSORIES
  // --------------------------------------------------

  const addAccessory = () => {
    const value =
      accessoryInput.trim();

    if (!value) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      accessories: [
        ...previous.accessories,
        value,
      ],
    }));

    setAccessoryInput("");
  };

  const removeAccessory = (
    index: number
  ) => {
    setForm((previous) => ({
      ...previous,

      accessories:
        previous.accessories.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  };

  const handleAccessoryKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addAccessory();
    }
  };

  // --------------------------------------------------
  // SELECTED CUSTOMER
  // --------------------------------------------------

  const selectedCustomer = useMemo(() => {
    return customers.find(
      (customer) =>
        String(customer.id) ===
        String(form.customer_id)
    );
  }, [
    customers,
    form.customer_id,
  ]);

  // --------------------------------------------------
  // CALCULATION
  // --------------------------------------------------

  const calculations = useMemo(() => {
    const labour =
      Number(form.labour_charge) || 0;

    const serviceCharge =
      Number(form.other_charge) || 0;

    const discount =
      Number(form.discount_amount) || 0;

    const gstPercent =
      Number(form.gst_percent) || 0;

    const paid =
      Number(form.paid_amount) || 0;

    const subtotal =
      labour + serviceCharge;

    const taxableAmount =
      Math.max(
        subtotal - discount,
        0
      );

    const gstAmount =
      taxableAmount *
      (gstPercent / 100);

    const grandTotal =
      taxableAmount +
      gstAmount;

    const balance =
      Math.max(
        grandTotal - paid,
        0
      );

    return {
      subtotal,
      taxableAmount,
      gstAmount,
      grandTotal,
      paid,
      balance,
    };
  }, [
    form.labour_charge,
    form.other_charge,
    form.discount_amount,
    form.gst_percent,
    form.paid_amount,
  ]);

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.customer_id) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (!form.service_type) {
      setError(
        "Please select service type."
      );
      return;
    }

    if (
      !form.customer_complaint.trim()
    ) {
      setError(
        "Please enter customer complaint."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * IMPORTANT
       * Accessories must be ARRAY.
       * Priority must match backend:
       * low / medium / high / urgent
       */

      const payload = {
        customer_id:
          Number(form.customer_id),

        asset_id:
          form.asset_id
            ? Number(form.asset_id)
            : null,

        service_type:
          form.service_type,

        entry_date:
          form.entry_date ||
          getToday(),

        expected_delivery_date:
          form.expected_delivery_date ||
          null,

        contact_person:
          form.contact_person ||
          null,

        phone:
          form.phone ||
          null,

        device_type:
          form.device_type ||
          null,

        brand:
          form.brand ||
          null,

        model:
          form.model ||
          null,

        serial_number:
          form.serial_number ||
          null,

        accessories:
          Array.isArray(
            form.accessories
          )
            ? form.accessories
            : [],

        customer_complaint:
          form.customer_complaint,

        technician_diagnosis:
          form.technician_diagnosis ||
          null,

        work_done:
          form.work_done ||
          null,

        final_remarks:
          form.final_remarks ||
          null,

        labour_charge:
          Number(
            form.labour_charge
          ) || 0,

        other_charge:
          Number(
            form.other_charge
          ) || 0,

        discount_amount:
          Number(
            form.discount_amount
          ) || 0,

        gst_percent:
          Number(
            form.gst_percent
          ) || 0,

        paid_amount:
          Number(
            form.paid_amount
          ) || 0,

        technician_id:
          form.technician_id
            ? Number(
                form.technician_id
              )
            : null,

        priority:
          form.priority,

        remarks:
          form.remarks ||
          null,

        status: "Received",
      };

      console.log(
        "SERVICE CREATE PAYLOAD:",
        payload
      );

      const response =
        await api.post(
          "/services",
          payload
        );

      const serviceId =
        response?.data?.data?.id ??
        response?.data?.service?.id ??
        response?.data?.id;

      setSuccess(
        "Service created successfully."
      );

      if (serviceId) {
        setTimeout(() => {
          navigate(
            `/service/${serviceId}`
          );
        }, 500);
      } else {
        setTimeout(() => {
          navigate("/services");
        }, 500);
      }
    } catch (err: any) {
      console.error(
        "Service create error:",
        err
      );

      const responseData =
        err?.response?.data;

      if (
        responseData?.errors &&
        typeof responseData.errors ===
          "object"
      ) {
        const messages =
          Object.values(
            responseData.errors
          )
            .flat()
            .map(String);

        setError(
          messages.join(" ")
        );
      } else {
        setError(
          responseData?.message ||
            "Unable to create service."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Service
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a new service entry.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/services")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to Services
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* CUSTOMER */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Customer & Device
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">

              {/* CUSTOMER */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.customer_id
                  }
                  onChange={(event) =>
                    handleCustomerChange(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {loading
                      ? "Loading customers..."
                      : customers.length ===
                        0
                      ? "No customers found"
                      : "Select Customer"}
                  </option>

                  {customers.map(
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

                        {customer.company_name &&
                        customer.company_name !==
                          customer.name
                          ? ` - ${customer.company_name}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {!loading &&
                  customers.length ===
                    0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No customers available.
                    </p>
                  )}
              </div>

              {/* SERVICE TYPE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service Type{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.service_type
                  }
                  onChange={(event) =>
                    updateField(
                      "service_type",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="repair">
                    Repair
                  </option>

                  <option value="maintenance">
                    Maintenance
                  </option>

                  <option value="installation">
                    Installation
                  </option>

                  <option value="inspection">
                    Inspection
                  </option>
                </select>
              </div>

              {/* ASSET */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Asset / Device
                </label>

                <select
                  value={
                    form.asset_id
                  }
                  onChange={(event) =>
                    handleAssetChange(
                      event.target.value
                    )
                  }
                  disabled={
                    !form.customer_id ||
                    loadingAssets
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {!form.customer_id
                      ? "Select customer first"
                      : loadingAssets
                      ? "Loading assets..."
                      : assets.length ===
                        0
                      ? "No assets found"
                      : "Select Asset"}
                  </option>

                  {assets.map(
                    (asset) => (
                      <option
                        key={asset.id}
                        value={asset.id}
                      >
                        {asset.asset_name ||
                          asset.name ||
                          asset.device_type ||
                          `Asset #${asset.id}`}

                        {asset.serial_number
                          ? ` - ${asset.serial_number}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* CONTACT PERSON */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Contact Person
                </label>

                <input
                  type="text"
                  value={
                    form.contact_person
                  }
                  onChange={(event) =>
                    updateField(
                      "contact_person",
                      event.target.value
                    )
                  }
                  placeholder="Contact Person"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone
                </label>

                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DEVICE TYPE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Device Type
                </label>

                <input
                  type="text"
                  value={
                    form.device_type
                  }
                  onChange={(event) =>
                    updateField(
                      "device_type",
                      event.target.value
                    )
                  }
                  placeholder="CCTV / Computer / Printer"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* BRAND */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Brand
                </label>

                <input
                  type="text"
                  value={form.brand}
                  onChange={(event) =>
                    updateField(
                      "brand",
                      event.target.value
                    )
                  }
                  placeholder="Brand"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* MODEL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Model
                </label>

                <input
                  type="text"
                  value={form.model}
                  onChange={(event) =>
                    updateField(
                      "model",
                      event.target.value
                    )
                  }
                  placeholder="Model"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* SERIAL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Serial Number
                </label>

                <input
                  type="text"
                  value={
                    form.serial_number
                  }
                  onChange={(event) =>
                    updateField(
                      "serial_number",
                      event.target.value
                    )
                  }
                  placeholder="Serial Number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* SELECTED CUSTOMER */}
            {selectedCustomer && (
              <div className="mx-6 mb-6 rounded-lg bg-slate-50 p-4">
                <div className="grid gap-3 text-sm md:grid-cols-3">

                  <div>
                    <div className="text-slate-500">
                      Customer
                    </div>

                    <div className="font-semibold text-slate-800">
                      {selectedCustomer.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500">
                      Phone
                    </div>

                    <div className="font-semibold text-slate-800">
                      {selectedCustomer.phone ||
                        selectedCustomer.mobile ||
                        "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500">
                      GSTIN
                    </div>

                    <div className="font-semibold text-slate-800">
                      {selectedCustomer.gstin ||
                        "-"}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* SERVICE DETAILS */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Service Details
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">

              {/* ENTRY DATE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Entry Date
                </label>

                <input
                  type="date"
                  value={
                    form.entry_date
                  }
                  onChange={(event) =>
                    updateField(
                      "entry_date",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DELIVERY DATE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Expected Delivery Date
                </label>

                <input
                  type="date"
                  value={
                    form.expected_delivery_date
                  }
                  onChange={(event) =>
                    updateField(
                      "expected_delivery_date",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* ACCESSORIES */}
              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Accessories Received
                </label>

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={
                      accessoryInput
                    }
                    onChange={(event) =>
                      setAccessoryInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleAccessoryKeyDown
                    }
                    placeholder="Type accessory and press Enter"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={
                      addAccessory
                    }
                    className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Add
                  </button>

                </div>

                {form.accessories.length >
                  0 && (
                  <div className="mt-3 flex flex-wrap gap-2">

                    {form.accessories.map(
                      (
                        accessory,
                        index
                      ) => (
                        <div
                          key={`${accessory}-${index}`}
                          className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                        >
                          <span>
                            {accessory}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeAccessory(
                                index
                              )
                            }
                            className="font-bold text-blue-600 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                  </div>
                )}
              </div>

              {/* COMPLAINT */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Complaint{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  value={
                    form.customer_complaint
                  }
                  onChange={(event) =>
                    updateField(
                      "customer_complaint",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter customer complaint..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DIAGNOSIS */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Technician Diagnosis
                </label>

                <textarea
                  value={
                    form.technician_diagnosis
                  }
                  onChange={(event) =>
                    updateField(
                      "technician_diagnosis",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Technician diagnosis..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* WORK DONE */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Work Done
                </label>

                <textarea
                  value={
                    form.work_done
                  }
                  onChange={(event) =>
                    updateField(
                      "work_done",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter work done..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* FINAL REMARKS */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Final Remarks
                </label>

                <textarea
                  value={
                    form.final_remarks
                  }
                  onChange={(event) =>
                    updateField(
                      "final_remarks",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Final remarks..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </div>

          {/* CHARGES */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Charges & Payment
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">

              {/* LABOUR */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Labour Charge
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.labour_charge
                  }
                  onChange={(event) =>
                    updateField(
                      "labour_charge",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* SERVICE CHARGE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service Charge
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.other_charge
                  }
                  onChange={(event) =>
                    updateField(
                      "other_charge",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* SPARE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Spare Charge
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                  Auto from Service Spare
                </div>
              </div>

              {/* DISCOUNT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.discount_amount
                  }
                  onChange={(event) =>
                    updateField(
                      "discount_amount",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* GST */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  GST %
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.gst_percent
                  }
                  onChange={(event) =>
                    updateField(
                      "gst_percent",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* PAID */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Paid Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.paid_amount
                  }
                  onChange={(event) =>
                    updateField(
                      "paid_amount",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* TOTAL */}
            <div className="mx-6 mb-6 rounded-xl bg-slate-900 p-5 text-white">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div>
                  <div className="text-xs text-slate-400">
                    Subtotal
                  </div>

                  <div className="mt-1 text-lg font-bold">
                    ₹{" "}
                    {calculations.subtotal.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    Taxable
                  </div>

                  <div className="mt-1 text-lg font-bold">
                    ₹{" "}
                    {calculations.taxableAmount.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    GST
                  </div>

                  <div className="mt-1 text-lg font-bold">
                    ₹{" "}
                    {calculations.gstAmount.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    Grand Total
                  </div>

                  <div className="mt-1 text-xl font-bold">
                    ₹{" "}
                    {calculations.grandTotal.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    Balance
                  </div>

                  <div className="mt-1 text-xl font-bold">
                    ₹{" "}
                    {calculations.balance.toFixed(
                      2
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ASSIGNMENT */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Assignment
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">

              {/* TECHNICIAN */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Technician
                </label>

                <select
                  value={
                    form.technician_id
                  }
                  onChange={(event) =>
                    updateField(
                      "technician_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select Technician
                  </option>

                  {technicians.map(
                    (technician) => (
                      <option
                        key={
                          technician.id
                        }
                        value={
                          technician.id
                        }
                      >
                        {technician.name ||
                          `Employee #${technician.id}`}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PRIORITY */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <select
                  value={
                    form.priority
                  }
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>

              {/* REMARKS */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </label>

                <textarea
                  value={
                    form.remarks
                  }
                  onChange={(event) =>
                    updateField(
                      "remarks",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Additional remarks..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                navigate("/services")
              }
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving || loading
              }
              className="rounded-lg bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Creating Service..."
                : "Create Service"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}