import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Customer {
  id: number;
  customer_code?: string;
  company_name?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gst_number?: string;
}

interface Product {
  id: number;
  product_name?: string;
  product_code?: string;
  hsn_code?: string;
  unit?: string;
  selling_price?: string | number;
  gst_percentage?: string | number;
}

interface QuotationItemForm {
  product_id: number | null;
  description: string;
  hsn_code: string;
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
  taxable_amount: number;
  gst_amount: number;
  total_amount: number;
}

const emptyItem = (): QuotationItemForm => ({
  product_id: null,
  description: "",
  hsn_code: "",
  quantity: 1,
  rate: 0,
  discount_amount: 0,
  gst_percent: 0,
  taxable_amount: 0,
  gst_amount: 0,
  total_amount: 0,
});

export default function QuotationCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("1. Goods once sold will not be taken back.\n2. Payment as per agreed terms.\n3. This quotation is valid for 15 days.");
  const [items, setItems] = useState<QuotationItemForm[]>([emptyItem()]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerResponse, productResponse] = await Promise.all([
          api.get("/customers"),
          api.get("/products"),
        ]);

        setCustomers(customerResponse.data?.data?.data ?? customerResponse.data?.data ?? []);
        setProducts(productResponse.data?.data?.data ?? productResponse.data?.data ?? []);
      } catch (error) {
        console.error("Unable to load customer/product data", error);
      }
    };

    loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === Number(customerId)) ?? null,
    [customers, customerId]
  );

  const round = (value: number) => Number(value || 0);

  const updateItem = (index: number, field: keyof QuotationItemForm, value: any) => {
    setItems((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "product_id") {
        const selectedProduct = products.find((product) => product.id === Number(value));
        updated[index].description = selectedProduct?.product_name || "";
        updated[index].hsn_code = selectedProduct?.hsn_code || "";
        updated[index].gst_percent = Number(selectedProduct?.gst_percentage ?? 0);
        updated[index].rate = Number(selectedProduct?.selling_price ?? 0);
      }

      const quantity = Number(updated[index].quantity || 0);
      const rate = Number(updated[index].rate || 0);
      const discount = Number(updated[index].discount_amount || 0);
      const gross = quantity * rate;
      const taxable = Math.max(0, gross - discount);
      const gstPercent = Number(updated[index].gst_percent || 0);
      const gstAmount = taxable * (gstPercent / 100);
      const totalAmount = taxable + gstAmount;

      updated[index].taxable_amount = taxable;
      updated[index].gst_amount = gstAmount;
      updated[index].total_amount = totalAmount;
      return updated;
    });
  };

  const addItem = () => setItems((current) => [...current, emptyItem()]);

  const removeItem = (index: number) => {
    setItems((current) => (current.length > 1 ? current.filter((_, idx) => idx !== index) : current));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0);
    const discount = items.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
    const taxable = Math.max(0, subtotal - discount);
    const gstAmount = items.reduce((sum, item) => sum + Number(item.gst_amount || 0), 0);
    const grand = taxable + gstAmount;
    return { subtotal, discount, taxable, gstAmount, grand };
  }, [items]);

  const submitQuotation = async () => {
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (items.some((item) => !item.product_id || Number(item.quantity || 0) <= 0)) {
      alert("Each quotation item must include a valid product and quantity.");
      return;
    }

    try {
      const payload = {
        customer_id: Number(customerId),
        quotation_date: quotationDate,
        valid_until: validUntil,
        notes,
        terms_conditions: terms,
        items: items.map((item) => ({
          product_id: Number(item.product_id),
          description: item.description,
          hsn_code: item.hsn_code,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          discount_amount: Number(item.discount_amount),
          gst_percent: Number(item.gst_percent),
          taxable_amount: Number(item.taxable_amount),
          gst_amount: Number(item.gst_amount),
          total_amount: Number(item.total_amount),
        })),
        subtotal: totals.subtotal,
        discount_amount: totals.discount,
        taxable_amount: totals.taxable,
        gst_amount: totals.gstAmount,
        grand_total: totals.grand,
      };

      const response = await api.post("/quotations", payload);
      const id = response.data?.quotation?.id;
      if (id) navigate(`/sales/quotations/${id}`);
      else navigate("/sales/quotations");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to create quotation.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create Quotation</h1>
          <p className="mt-1 text-sm text-slate-500">Add new quotation using existing customer and product master</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value ? Number(event.target.value) : "")} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.company_name || customer.contact_person}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quotation Date</label>
            <input type="date" value={quotationDate} onChange={(event) => setQuotationDate(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Valid Until</label>
            <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Prepared By</label>
            <input value="System User" disabled className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600" />
          </div>
        </div>

        {selectedCustomer && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-800">Customer Details</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div><strong>Name:</strong> {selectedCustomer.company_name}</div>
              <div><strong>Contact:</strong> {selectedCustomer.contact_person}</div>
              <div><strong>Phone:</strong> {selectedCustomer.mobile}</div>
              <div><strong>Email:</strong> {selectedCustomer.email || "-"}</div>
              <div><strong>City:</strong> {selectedCustomer.city || "-"}</div>
              <div><strong>State:</strong> {selectedCustomer.state || "-"}</div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Item #{index + 1}</h3>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Product</label>
                  <select value={item.product_id ?? ""} onChange={(event) => updateItem(index, "product_id", event.target.value ? Number(event.target.value) : null)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.product_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">HSN/SAC</label>
                  <input value={item.hsn_code} onChange={(event) => updateItem(index, "hsn_code", event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                  <input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Qty</label>
                  <input type="number" min="1" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Rate</label>
                  <input type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateItem(index, "rate", Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Discount</label>
                  <input type="number" min="0" step="0.01" value={item.discount_amount} onChange={(event) => updateItem(index, "discount_amount", Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">GST %</label>
                  <input type="number" min="0" step="0.01" value={item.gst_percent} onChange={(event) => updateItem(index, "gst_percent", Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div><div className="text-xs text-slate-500">Taxable</div><div className="font-medium">₹ {round(item.taxable_amount).toFixed(2)}</div></div>
                <div><div className="text-xs text-slate-500">GST</div><div className="font-medium">₹ {round(item.gst_amount).toFixed(2)}</div></div>
                <div><div className="text-xs text-slate-500">Total</div><div className="font-medium">₹ {round(item.total_amount).toFixed(2)}</div></div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addItem} className="rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">+ Add Item</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Terms & Conditions</label>
            <textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div><div className="text-xs text-slate-500">Subtotal</div><div className="font-semibold">₹ {totals.subtotal.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-500">Discount</div><div className="font-semibold">₹ {totals.discount.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-500">Taxable</div><div className="font-semibold">₹ {totals.taxable.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-500">GST</div><div className="font-semibold">₹ {totals.gstAmount.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-500">Grand Total</div><div className="font-semibold text-blue-700">₹ {totals.grand.toFixed(2)}</div></div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => navigate("/sales/quotations")} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submitQuotation} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Save Quotation</button>
        </div>
      </div>
    </div>
  );
}
