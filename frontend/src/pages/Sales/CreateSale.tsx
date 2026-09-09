import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Customer {
  id: number;
  customer_code: string;
  company_name: string;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  selling_price: string;
  current_stock: string;
  gst_percentage: string;
}

interface SaleItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  rate: number;
  discount_amount: number;
  gst_percent: number;
  current_stock: number;
}

export default function CreateSale() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState<SaleItem[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [customerResponse, productResponse] = await Promise.all([
          api.get("/customers", {
            params: {
              per_page: 100,
            },
          }),
          api.get("/products", {
            params: {
              per_page: 100,
            },
          }),
        ]);

        setCustomers(customerResponse.data.data ?? []);
        setProducts(productResponse.data.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load customers and products.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);

    const product = products.find(
      (item) => String(item.id) === productId
    );

    if (!product) {
      setRate(0);
      setGstPercent(0);
      return;
    }

    setRate(Number(product.selling_price));
    setGstPercent(Number(product.gst_percentage));
  };

  const addItem = () => {
    setError("");

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (rate < 0) {
      setError("Rate cannot be negative.");
      return;
    }

    const product = products.find(
      (item) => String(item.id) === selectedProductId
    );

    if (!product) {
      setError("Product not found.");
      return;
    }

    const stock = Number(product.current_stock);

    if (quantity > stock) {
      setError(
        `Insufficient stock. Available stock: ${stock}`
      );
      return;
    }

    const existingItem = items.find(
      (item) => item.product_id === product.id
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + quantity;

      if (newQuantity > stock) {
        setError(
          `Insufficient stock. Available stock: ${stock}`
        );
        return;
      }

      setItems(
        items.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                rate,
                discount_amount:
                  discountAmount,
                gst_percent: gstPercent,
              }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          quantity,
          rate,
          discount_amount: discountAmount,
          gst_percent: gstPercent,
          current_stock: stock,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
    setRate(0);
    setDiscountAmount(0);
    setGstPercent(0);
  };

  const removeItem = (productId: number) => {
    setItems(
      items.filter(
        (item) => item.product_id !== productId
      )
    );
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.quantity * item.rate,
      0
    );
  }, [items]);

  const itemDiscountTotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.discount_amount,
      0
    );
  }, [items]);

  const gstTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const gross =
        item.quantity * item.rate;

      const taxable =
        Math.max(
          0,
          gross - item.discount_amount
        );

      return (
        total +
        taxable *
          (item.gst_percent / 100)
      );
    }, 0);
  }, [items]);

  const taxableAmount = Math.max(
    0,
    subtotal -
      itemDiscountTotal -
      invoiceDiscount
  );

  const grandTotal =
    taxableAmount +
    gstTotal +
    otherCharges;

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

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSave = async () => {
    setError("");

    if (items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    if (paidAmount > grandTotal) {
      setError(
        "Paid amount cannot be greater than invoice total."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/sales", {
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
        payment_mode: paymentMode,
        reference_no:
          referenceNo || null,
        notes: notes || null,
      });

      navigate("/sales");
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ??
        "Unable to create sale.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        Loading customers and products...
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Create Sale
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new sales invoice
          </p>
        </div>

        <button
          onClick={() => navigate("/sales")}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invoice Details */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Invoice Details
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Sale Date
            </label>

            <input
              type="date"
              value={saleDate}
              onChange={(e) =>
                setSaleDate(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Customer
            </label>

            <select
              value={customerId}
              onChange={(e) =>
                setCustomerId(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
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
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Add Product
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product
            </label>

            <select
              value={selectedProductId}
              onChange={(e) =>
                handleProductChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="">
                Select Product
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.product_code} -{" "}
                  {product.product_name}{" "}
                  (Stock: {product.current_stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

        </div>

        <div className="mt-4 flex items-end gap-4">

          <div className="w-48">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Item Discount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(e) =>
                setDiscountAmount(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            + Add Product
          </button>

        </div>

      </div>

      {/* Items */}
      <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-slate-800">
            Invoice Items
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50">

              <tr>
                <th className="px-5 py-3 text-sm">
                  Product
                </th>

                <th className="px-5 py-3 text-right text-sm">
                  Qty
                </th>

                <th className="px-5 py-3 text-right text-sm">
                  Rate
                </th>

                <th className="px-5 py-3 text-right text-sm">
                  Discount
                </th>

                <th className="px-5 py-3 text-right text-sm">
                  GST
                </th>

                <th className="px-5 py-3 text-right text-sm">
                  Total
                </th>

                <th className="px-5 py-3 text-center text-sm">
                  Action
                </th>
              </tr>

            </thead>

            <tbody>

              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No products added.
                  </td>
                </tr>
              ) : (
                items.map((item) => {

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
                    <tr
                      key={item.product_id}
                      className="border-t"
                    >

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {item.product_name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {item.product_code}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-right">
                        ₹ {formatAmount(item.rate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        ₹{" "}
                        {formatAmount(
                          item.discount_amount
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        ₹ {formatAmount(gst)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold">
                        ₹ {formatAmount(total)}
                      </td>

                      <td className="px-5 py-4 text-center">

                        <button
                          onClick={() =>
                            removeItem(
                              item.product_id
                            )
                          }
                          className="text-sm font-medium text-red-600 hover:underline"
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

        {/* Payment */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-semibold text-slate-800">
            Payment
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Paid Amount
              </label>

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment Mode
              </label>

              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Cheque</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Reference No
              </label>

              <input
                type="text"
                value={referenceNo}
                onChange={(e) =>
                  setReferenceNo(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Invoice Discount
              </label>

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Other Charges
              </label>

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-semibold text-slate-800">
            Invoice Summary
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                ₹ {formatAmount(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Item Discount</span>
              <span>
                ₹{" "}
                {formatAmount(
                  itemDiscountTotal
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Invoice Discount</span>
              <span>
                ₹{" "}
                {formatAmount(
                  invoiceDiscount
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Taxable Amount</span>
              <span>
                ₹{" "}
                {formatAmount(
                  taxableAmount
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>GST</span>
              <span>
                ₹ {formatAmount(gstTotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Other Charges</span>
              <span>
                ₹{" "}
                {formatAmount(
                  otherCharges
                )}
              </span>
            </div>

            <div className="my-3 border-t" />

            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>
                ₹ {formatAmount(grandTotal)}
              </span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>
                ₹ {formatAmount(paidAmount)}
              </span>
            </div>

            <div className="flex justify-between text-red-600">
              <span>Balance</span>
              <span>
                ₹ {formatAmount(balanceAmount)}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span>Status</span>

              <span className="font-bold">
                {paymentStatus}
              </span>
            </div>

          </div>

          <button
            onClick={handleSave}
            disabled={loading || items.length === 0}
            className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Save Sale"}
          </button>

        </div>

      </div>

    </div>
  );
}