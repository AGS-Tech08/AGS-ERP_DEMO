import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type Customer = {
  id: number;
  customer_code: string;
  company_name: string;
};

type Product = {
  id: number;
  product_code: string;
  product_name: string;
  selling_price: string | number;
  current_stock: string | number;
  gst_percentage: string | number;
  unit?: string;
};

type SaleItem = {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
  current_stock: number;
};

export default function SalesNew() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customerId, setCustomerId] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  const [items, setItems] = useState<SaleItem[]>([]);

  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      setError("");

      const [customersResponse, productsResponse] =
        await Promise.all([
          api.get("/customers", {
            params: {
              per_page: 1000,
            },
          }),
          api.get("/products", {
            params: {
              per_page: 1000,
            },
          }),
        ]);

      setCustomers(
        customersResponse.data.data ?? []
      );

      setProducts(
        productsResponse.data.data ?? []
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Unable to load customers and products."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        String(product.id) === selectedProductId
    );
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setRate(0);
      setGstPercent(0);
      return;
    }

    setRate(
      Number(selectedProduct.selling_price || 0)
    );

    setGstPercent(
      Number(selectedProduct.gst_percentage || 0)
    );

    setQuantity(1);
    setItemDiscount(0);
  }, [selectedProduct]);

  const itemGross = quantity * rate;

  const itemTaxable = Math.max(
    0,
    itemGross - itemDiscount
  );

  const itemGst =
    itemTaxable * (gstPercent / 100);

  const itemTotal =
    itemTaxable + itemGst;

  const addItem = () => {
    setError("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (quantity > Number(selectedProduct.current_stock)) {
      setError(
        `Insufficient stock. Available stock: ${selectedProduct.current_stock}`
      );
      return;
    }

    if (rate < 0) {
      setError("Rate cannot be negative.");
      return;
    }

    if (itemDiscount < 0) {
      setError("Discount cannot be negative.");
      return;
    }

    if (itemDiscount > itemGross) {
      setError(
        "Item discount cannot be greater than item amount."
      );
      return;
    }

    const existingIndex = items.findIndex(
      (item) =>
        item.product_id === selectedProduct.id
    );

    if (existingIndex >= 0) {
      const updatedItems = [...items];

      const newQuantity =
        updatedItems[existingIndex].quantity +
        quantity;

      if (
        newQuantity >
        Number(selectedProduct.current_stock)
      ) {
        setError(
          `Total quantity cannot exceed available stock: ${selectedProduct.current_stock}`
        );
        return;
      }

      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQuantity,
        rate,
        discount_amount: itemDiscount,
        gst_percent: gstPercent,
      };

      setItems(updatedItems);
    } else {
      setItems([
        ...items,
        {
          product_id: selectedProduct.id,
          product_name:
            selectedProduct.product_name,
          product_code:
            selectedProduct.product_code,
          quantity,
          rate,
          discount_amount: itemDiscount,
          gst_percent: gstPercent,
          current_stock: Number(
            selectedProduct.current_stock
          ),
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
    setRate(0);
    setItemDiscount(0);
    setGstPercent(0);
  };

  const removeItem = (index: number) => {
    setItems(
      items.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const updateItemQuantity = (
    index: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      return;
    }

    const updatedItems = [...items];

    if (
      newQuantity >
      updatedItems[index].current_stock
    ) {
      setError(
        `Available stock for ${updatedItems[index].product_name}: ${updatedItems[index].current_stock}`
      );
      return;
    }

    updatedItems[index].quantity = newQuantity;

    setItems(updatedItems);
    setError("");
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + item.quantity * item.rate,
      0
    );
  }, [items]);

  const itemDiscountTotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + item.discount_amount,
      0
    );
  }, [items]);

  const gstTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const gross =
        item.quantity * item.rate;

      const taxable = Math.max(
        0,
        gross - item.discount_amount
      );

      return (
        sum +
        taxable * (item.gst_percent / 100)
      );
    }, 0);
  }, [items]);

  const totalDiscount =
    itemDiscountTotal + invoiceDiscount;

  const taxableAmount = Math.max(
    0,
    subtotal - totalDiscount
  );

  const grandTotal = Math.max(
    0,
    taxableAmount +
      gstTotal +
      otherCharges
  );

  const balanceAmount = Math.max(
    0,
    grandTotal - paidAmount
  );

  const paymentStatus =
    paidAmount <= 0
      ? "UNPAID"
      : balanceAmount <= 0
        ? "PAID"
        : "PARTIAL";

  const formatAmount = (
    amount: number
  ) => {
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const saveSale = async () => {
    setError("");

    if (!saleDate) {
      setError("Please select sale date.");
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one product."
      );
      return;
    }

    if (paidAmount < 0) {
      setError(
        "Paid amount cannot be negative."
      );
      return;
    }

    if (paidAmount > grandTotal) {
      setError(
        "Paid amount cannot be greater than invoice total."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        sale_date: saleDate,
        customer_id: customerId
          ? Number(customerId)
          : null,

        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          rate: item.rate,
          discount_amount:
            item.discount_amount,
          gst_percent: item.gst_percent,
        })),

        discount_amount: invoiceDiscount,
        other_charges: otherCharges,
        paid_amount: paidAmount,
        payment_mode:
          paidAmount > 0
            ? paymentMode
            : null,
        reference_no:
          referenceNo || null,
        notes: notes || null,
      };

      const response = await api.post(
        "/sales",
        payload
      );

      const invoice =
        response.data?.sale?.invoice_no;

      alert(
        invoice
          ? `Invoice ${invoice} created successfully.`
          : "Sale created successfully."
      );

      navigate("/sales");
    } catch (err: any) {
      console.error(err);

      const backendMessage =
        err?.response?.data?.message;

      const validationErrors =
        err?.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)
            .flat()
            .find(Boolean);

        setError(
          String(
            firstError ||
              backendMessage ||
              "Validation failed."
          )
        );
      } else {
        setError(
          backendMessage ||
            "Unable to create invoice."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Loading billing data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            New Bill
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create sales invoice
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sales")}
          className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Back to Sales
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invoice Details */}
      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Invoice Details
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sale Date
            </label>

            <input
              type="date"
              value={saleDate}
              onChange={(e) =>
                setSaleDate(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer
            </label>

            <select
              value={customerId}
              onChange={(e) =>
                setCustomerId(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">
                Walk-in Customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.customer_code} -{" "}
                  {customer.company_name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Add Product */}
      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Add Product
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product
            </label>

            <select
              value={selectedProductId}
              onChange={(e) =>
                setSelectedProductId(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">
                Select Product
              </option>

              {products
                .filter(
                  (product) =>
                    Number(product.current_stock) > 0
                )
                .map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.product_code} -{" "}
                    {product.product_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Stock
            </label>

            <input
              type="text"
              readOnly
              value={
                selectedProduct
                  ? selectedProduct.current_stock
                  : ""
              }
              className="w-full rounded-lg border bg-gray-50 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>

            <input
              type="number"
              min="0.001"
              step="0.001"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rate
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) =>
                setRate(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              GST %
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={gstPercent}
              onChange={(e) =>
                setGstPercent(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Item Discount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={itemDiscount}
              onChange={(e) =>
                setItemDiscount(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Taxable
            </label>

            <input
              readOnly
              value={formatAmount(itemTaxable)}
              className="w-full rounded-lg border bg-gray-50 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              GST Amount
            </label>

            <input
              readOnly
              value={formatAmount(itemGst)}
              className="w-full rounded-lg border bg-gray-50 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Item Total
            </label>

            <input
              readOnly
              value={formatAmount(itemTotal)}
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 font-semibold"
            />
          </div>

        </div>

        <div className="mt-4 flex justify-end">

          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            + Add Product
          </button>

        </div>

      </div>

      {/* Items */}
      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Invoice Items
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-gray-50">

              <tr>
                <th className="px-4 py-3 text-left">
                  Product
                </th>

                <th className="px-4 py-3 text-center">
                  Qty
                </th>

                <th className="px-4 py-3 text-right">
                  Rate
                </th>

                <th className="px-4 py-3 text-right">
                  Discount
                </th>

                <th className="px-4 py-3 text-right">
                  GST
                </th>

                <th className="px-4 py-3 text-right">
                  Total
                </th>

                <th className="px-4 py-3 text-center">
                  Action
                </th>
              </tr>

            </thead>

            <tbody className="divide-y">

              {items.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No products added.
                  </td>
                </tr>

              ) : (

                items.map((item, index) => {

                  const gross =
                    item.quantity *
                    item.rate;

                  const taxable =
                    Math.max(
                      0,
                      gross -
                        item.discount_amount
                    );

                  const gst =
                    taxable *
                    (item.gst_percent / 100);

                  const total =
                    taxable + gst;

                  return (
                    <tr key={index}>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.product_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.product_code}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">

                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              index,
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-24 rounded border px-2 py-1 text-center"
                        />

                      </td>

                      <td className="px-4 py-3 text-right">
                        ₹ {formatAmount(item.rate)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        ₹{" "}
                        {formatAmount(
                          item.discount_amount
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.gst_percent.toFixed(2)}%
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        ₹ {formatAmount(total)}
                      </td>

                      <td className="px-4 py-3 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(index)
                          }
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                        >
                          Remove
                        </button>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Notes / Payment */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Payment Details
          </h2>

          <div className="space-y-4">

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment Mode
              </label>

              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="Cash">
                  Cash
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="Card">
                  Card
                </option>

                <option value="Bank">
                  Bank Transfer
                </option>

                <option value="Cheque">
                  Cheque
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Reference No
              </label>

              <input
                type="text"
                value={referenceNo}
                onChange={(e) =>
                  setReferenceNo(e.target.value)
                }
                placeholder="UPI / Cheque / Transaction No"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                rows={4}
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Invoice notes..."
              />
            </div>

          </div>

        </div>

        {/* Totals */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Invoice Summary
          </h2>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-600">
                Subtotal
              </span>

              <span className="font-medium">
                ₹ {formatAmount(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Item Discount
              </span>

              <span>
                ₹{" "}
                {formatAmount(
                  itemDiscountTotal
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">

              <span className="text-gray-600">
                Invoice Discount
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={invoiceDiscount}
                onChange={(e) =>
                  setInvoiceDiscount(
                    Number(e.target.value)
                  )
                }
                className="w-32 rounded border px-2 py-1 text-right"
              />

            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                GST
              </span>

              <span>
                ₹ {formatAmount(gstTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">

              <span className="text-gray-600">
                Other Charges
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={otherCharges}
                onChange={(e) =>
                  setOtherCharges(
                    Number(e.target.value)
                  )
                }
                className="w-32 rounded border px-2 py-1 text-right"
              />

            </div>

            <div className="my-3 border-t" />

            <div className="flex justify-between text-xl font-bold">

              <span>
                Grand Total
              </span>

              <span>
                ₹ {formatAmount(grandTotal)}
              </span>

            </div>

            <div className="flex items-center justify-between gap-4">

              <span className="text-gray-600">
                Paid Amount
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(
                    Number(e.target.value)
                  )
                }
                className="w-40 rounded-lg border px-3 py-2 text-right font-medium"
              />

            </div>

            <div className="flex justify-between text-lg">

              <span className="text-gray-600">
                Balance
              </span>

              <span className="font-bold text-red-600">
                ₹ {formatAmount(balanceAmount)}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-600">
                Status
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : paymentStatus === "PARTIAL"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {paymentStatus}
              </span>

            </div>

          </div>

          <button
            type="button"
            disabled={
              saving ||
              items.length === 0
            }
            onClick={saveSale}
            className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Saving Invoice..."
              : "Save Invoice"}
          </button>

        </div>

      </div>

    </div>
  );
}