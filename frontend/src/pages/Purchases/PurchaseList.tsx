import { useEffect, useState } from "react";
import api from "../../services/api";

interface Vendor {
  id: number;
  vendor_code: string;
  company_name: string;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  current_stock: number | string;
}

interface PurchaseItem {
  id?: number;
  product_id: string;
  quantity: string;
  purchase_price: string;
  gst_percentage: string;
}

interface Purchase {
  id: number;
  purchase_code: string;
  purchase_date: string;
  supplier_invoice_no?: string;
  supplier_invoice_date?: string;
  grand_total: number | string;
  paid_amount: number | string;
  balance_amount: number | string;
  payment_status: string;
  purchase_status: string;
  vendor?: Vendor;
  items?: PurchaseItem[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

const emptyItem = (): PurchaseItem => ({
  product_id: "",
  quantity: "1",
  purchase_price: "0",
  gst_percentage: "18",
});

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* PAYMENT MODAL */
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<Purchase | null>(null);

  const [vendorId, setVendorId] = useState("");

  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [discountAmount, setDiscountAmount] = useState("0");

  /*
   * Backend field remains `other_charges`.
   * UI label is now "Postage & Courier Charges".
   */
  const [otherCharges, setOtherCharges] = useState("0");

  const [paidAmount, setPaidAmount] = useState("0");

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([
    emptyItem(),
  ]);

  /* PAYMENT FORM */
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  /*
   * ============================================================
   * LOAD PURCHASES
   * ============================================================
   */

  const loadPurchases = async (
    currentPage = page,
    searchText = search
  ) => {
    try {
      setLoading(true);

      const response = await api.get("/purchases", {
        params: {
          page: currentPage,
          search: searchText || undefined,
        },
      });

      const result = response.data?.data;

      if (result && Array.isArray(result.data)) {
        setPurchases(result.data);

        setPagination({
          current_page: result.current_page ?? 1,
          last_page: result.last_page ?? 1,
          total: result.total ?? 0,
        });
      } else if (Array.isArray(result)) {
        setPurchases(result);

        setPagination({
          current_page: 1,
          last_page: 1,
          total: result.length,
        });
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error("Purchase Load Error:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * LOAD VENDORS
   * ============================================================
   */

  const loadVendors = async () => {
    try {
      const response = await api.get("/vendors");

      const result = response.data?.data;

      if (result && Array.isArray(result.data)) {
        setVendors(result.data);
      } else if (Array.isArray(result)) {
        setVendors(result);
      }
    } catch (error) {
      console.error("Vendor Load Error:", error);
    }
  };

  /*
   * ============================================================
   * LOAD PRODUCTS
   * ============================================================
   */

  const loadProducts = async () => {
    try {
      const response = await api.get("/products", {
        params: {
          per_page: 1000,
        },
      });

      const result = response.data?.data;

      if (result && Array.isArray(result.data)) {
        setProducts(result.data);
      } else if (Array.isArray(result)) {
        setProducts(result);
      }
    } catch (error) {
      console.error("Product Load Error:", error);
    }
  };

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadPurchases(1, "");
    loadVendors();
    loadProducts();
  }, []);

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  const handleSearch = () => {
    setPage(1);
    loadPurchases(1, search);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
    loadPurchases(1, "");
  };

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const handlePrevious = () => {
    if (page > 1) {
      const newPage = page - 1;

      setPage(newPage);
      loadPurchases(newPage, search);
    }
  };

  const handleNext = () => {
    if (page < pagination.last_page) {
      const newPage = page + 1;

      setPage(newPage);
      loadPurchases(newPage, search);
    }
  };

  /*
   * ============================================================
   * ADD ITEM
   * ============================================================
   */

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      emptyItem(),
    ]);
  };

  /*
   * ============================================================
   * REMOVE ITEM
   * ============================================================
   */

  const removeItem = (index: number) => {
    if (items.length === 1) {
      return;
    }

    setItems((prev) =>
      prev.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  /*
   * ============================================================
   * UPDATE ITEM
   * ============================================================
   */

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  /*
   * ============================================================
   * ITEM CALCULATION
   * ============================================================
   */

  const getItemValues = (item: PurchaseItem) => {
    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.purchase_price) || 0;

    const gst =
      Number(item.gst_percentage) || 0;

    const subtotal =
      quantity * price;

    const gstAmount =
      subtotal * (gst / 100);

    const total =
      subtotal + gstAmount;

    return {
      subtotal,
      gstAmount,
      total,
    };
  };

  /*
   * ============================================================
   * TOTAL CALCULATIONS
   *
   * Subtotal
   * + Postage & Courier
   * - Discount
   * = Taxable Amount
   * + GST
   * = Grand Total
   * ============================================================
   */

  const subtotal = items.reduce(
    (sum, item) =>
      sum + getItemValues(item).subtotal,
    0
  );

  const gstAmount = items.reduce(
    (sum, item) =>
      sum + getItemValues(item).gstAmount,
    0
  );

  const discount =
    Number(discountAmount) || 0;

  const postageCourier =
    Number(otherCharges) || 0;

  const paid =
    Number(paidAmount) || 0;

  /*
   * Postage & Courier is included in taxable value.
   */
  const taxableAmount = Math.max(
    subtotal +
      postageCourier -
      discount,
    0
  );

  /*
   * GST calculated from taxable amount.
   */
  const effectiveGstRate =
    subtotal > 0
      ? gstAmount / subtotal
      : 0;

  const finalGstAmount =
    taxableAmount * effectiveGstRate;

  const grandTotal =
    taxableAmount +
    finalGstAmount;

  const balanceAmount =
    Math.max(
      grandTotal - paid,
      0
    );

  /*
   * ============================================================
   * RESET FORM
   * ============================================================
   */

  const resetForm = () => {
    setEditingId(null);

    setVendorId("");

    setPurchaseDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setInvoiceNo("");
    setInvoiceDate("");

    setDiscountAmount("0");
    setOtherCharges("0");
    setPaidAmount("0");

    setNotes("");

    setItems([
      emptyItem(),
    ]);
  };

  /*
   * ============================================================
   * OPEN CREATE FORM
   * ============================================================
   */

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  /*
   * ============================================================
   * OPEN EDIT FORM
   * ============================================================
   */

  const openEditForm = async (
    purchase: Purchase
  ) => {
    try {
      setSaving(true);

      const response =
        await api.get(
          `/purchases/${purchase.id}`
        );

      const data =
        response.data?.data ??
        response.data?.purchase ??
        response.data;

      setEditingId(purchase.id);

      setVendorId(
        String(
          data.vendor_id ??
            purchase.vendor?.id ??
            ""
        )
      );

      setPurchaseDate(
        data.purchase_date
          ? String(
              data.purchase_date
            ).substring(0, 10)
          : ""
      );

      setInvoiceNo(
        data.supplier_invoice_no ?? ""
      );

      setInvoiceDate(
        data.supplier_invoice_date
          ? String(
              data.supplier_invoice_date
            ).substring(0, 10)
          : ""
      );

      setDiscountAmount(
        String(
          data.discount_amount ?? 0
        )
      );

      /*
       * Existing backend field.
       * Displayed as Postage & Courier.
       */
      setOtherCharges(
        String(
          data.other_charges ?? 0
        )
      );

      setPaidAmount(
        String(
          data.paid_amount ?? 0
        )
      );

      setNotes(
        data.notes ?? ""
      );

      if (
        Array.isArray(data.items) &&
        data.items.length > 0
      ) {
        setItems(
          data.items.map(
            (item: any) => ({
              id: item.id,

              product_id: String(
                item.product_id ?? ""
              ),

              quantity: String(
                item.quantity ?? 1
              ),

              purchase_price:
                String(
                  item.purchase_price ??
                    0
                ),

              gst_percentage:
                String(
                  item.gst_percentage ??
                    18
                ),
            })
          )
        );
      } else {
        setItems([
          emptyItem(),
        ]);
      }

      setShowForm(true);
    } catch (error: any) {
      console.error(
        "Purchase Edit Load Error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to load purchase details."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * SAVE PURCHASE
   * ============================================================
   */

  const handleSave = async () => {
    if (!vendorId) {
      alert("Please select Vendor.");
      return;
    }

    if (!purchaseDate) {
      alert(
        "Please select Purchase Date."
      );
      return;
    }

    const invalidItem =
      items.some(
        (item) =>
          !item.product_id ||
          Number(item.quantity) <= 0 ||
          Number(item.purchase_price) < 0
      );

    if (invalidItem) {
      alert(
        "Please check Product, Quantity and Purchase Price."
      );
      return;
    }

    if (
      paid < 0 ||
      paid > grandTotal
    ) {
      alert(
        "Paid amount cannot be greater than Grand Total."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vendor_id:
          Number(vendorId),

        purchase_date:
          purchaseDate,

        supplier_invoice_no:
          invoiceNo || null,

        supplier_invoice_date:
          invoiceDate || null,

        discount_amount:
          discount,

        /*
         * Backend field unchanged.
         */
        other_charges:
          postageCourier,

        paid_amount:
          paid,

        purchase_status:
          "Received",

        notes:
          notes || null,

        items:
          items.map(
            (item) => ({
              ...(item.id
                ? {
                    id: item.id,
                  }
                : {}),

              product_id:
                Number(
                  item.product_id
                ),

              quantity:
                Number(
                  item.quantity
                ),

              purchase_price:
                Number(
                  item.purchase_price
                ),

              discount_percentage:
                0,

              gst_percentage:
                Number(
                  item.gst_percentage
                ) || 0,
            })
          ),
      };

      if (editingId) {
        await api.put(
          `/purchases/${editingId}`,
          payload
        );

        alert(
          "Purchase updated successfully."
        );
      } else {
        await api.post(
          "/purchases",
          payload
        );

        alert(
          "Purchase created successfully."
        );
      }

      setShowForm(false);

      resetForm();

      setPage(1);

      await loadPurchases(
        1,
        search
      );

      await loadProducts();
    } catch (error: any) {
      console.error(
        "Purchase Save Error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Purchase save failed.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * OPEN PAYMENT MODAL
   * ============================================================
   */

  const openPayment = (
    purchase: Purchase
  ) => {
    const balance =
      Number(
        purchase.balance_amount
      ) || 0;

    if (balance <= 0) {
      alert(
        "This purchase is already fully paid."
      );
      return;
    }

    setSelectedPurchase(
      purchase
    );

    setPaymentDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setPaymentAmount(
      balance.toFixed(2)
    );

    setPaymentMode("Cash");

    setReferenceNo("");

    setPaymentNotes("");

    setShowPayment(true);
  };

  /*
   * ============================================================
   * CLOSE PAYMENT MODAL
   * ============================================================
   */

  const closePayment = () => {
    if (paymentSaving) {
      return;
    }

    setShowPayment(false);

    setSelectedPurchase(null);

    setPaymentAmount("");

    setReferenceNo("");

    setPaymentNotes("");

    setPaymentMode("Cash");
  };

  /*
   * ============================================================
   * SAVE VENDOR PAYMENT
   * ============================================================
   */

  const handlePayment = async () => {
    if (!selectedPurchase) {
      return;
    }

    const amount =
      Number(paymentAmount) || 0;

    const balance =
      Number(
        selectedPurchase.balance_amount
      ) || 0;

    if (!paymentDate) {
      alert(
        "Please select Payment Date."
      );
      return;
    }

    if (amount <= 0) {
      alert(
        "Please enter valid payment amount."
      );
      return;
    }

    if (amount > balance) {
      alert(
        `Payment cannot be greater than balance ₹${balance.toFixed(
          2
        )}.`
      );
      return;
    }

    try {
      setPaymentSaving(true);

      const response =
        await api.post(
          "/vendor-payments",
          {
            purchase_id:
              selectedPurchase.id,

            payment_date:
              paymentDate,

            amount:
              amount,

            payment_mode:
              paymentMode,

            reference_no:
              referenceNo || null,

            notes:
              paymentNotes || null,
          }
        );

      console.log(
        "Payment Saved:",
        response.data
      );

      setShowPayment(false);

      setSelectedPurchase(null);

      setPaymentAmount("");

      setReferenceNo("");

      setPaymentNotes("");

      await loadPurchases(
        page,
        search
      );

      alert(
        "Vendor payment saved successfully."
      );
    } catch (error: any) {
      console.error(
        "Vendor Payment Error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Payment save failed.";

      alert(message);
    } finally {
      setPaymentSaving(false);
    }
  };

  /*
   * ============================================================
   * PAYMENT BALANCE
   * ============================================================
   */

  const paymentBalance =
    selectedPurchase
      ? Number(
          selectedPurchase.balance_amount
        ) || 0
      : 0;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div>

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Purchase Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage vendor purchases and stock
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateForm
          }
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          + Add Purchase
        </button>

      </div>

      {/* SEARCH */}

      <div className="mb-5 rounded-xl bg-white p-4 shadow">

        <div className="flex flex-col gap-3 md:flex-row">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search purchase code, invoice or vendor..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={
              handleSearch
            }
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Search
          </button>

          <button
            type="button"
            onClick={
              handleClear
            }
            className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300"
          >
            Clear
          </button>

        </div>

      </div>

      {/* PURCHASE FORM */}

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? "Edit Purchase"
                  : "Create Purchase"}
              </h2>

              {editingId && (
                <p className="mt-1 text-sm text-gray-500">
                  Purchase ID:{" "}
                  {editingId}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(
                  false
                );

                resetForm();
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Close
            </button>

          </div>

          {/* PURCHASE DETAILS */}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Vendor *
              </label>

              <select
                value={
                  vendorId
                }
                onChange={(e) =>
                  setVendorId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">
                  Select Vendor
                </option>

                {vendors.map(
                  (vendor) => (
                    <option
                      key={
                        vendor.id
                      }
                      value={
                        vendor.id
                      }
                    >
                      {
                        vendor.vendor_code
                      }{" "}
                      -{" "}
                      {
                        vendor.company_name
                      }
                    </option>
                  )
                )}

              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Purchase Date *
              </label>

              <input
                type="date"
                value={
                  purchaseDate
                }
                onChange={(e) =>
                  setPurchaseDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Supplier Invoice No
              </label>

              <input
                type="text"
                value={
                  invoiceNo
                }
                onChange={(e) =>
                  setInvoiceNo(
                    e.target.value
                  )
                }
                placeholder="Invoice Number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Invoice Date
              </label>

              <input
                type="date"
                value={
                  invoiceDate
                }
                onChange={(e) =>
                  setInvoiceDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

          </div>

          {/* ITEMS */}

          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-lg font-semibold">
                Purchase Items
              </h3>

              <button
                type="button"
                onClick={
                  addItem
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
              >
                + Add Item
              </button>

            </div>

            <div className="overflow-x-auto rounded-lg border">

              <table className="min-w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="p-3 text-left">
                      Product
                    </th>

                    <th className="p-3 text-right">
                      Qty
                    </th>

                    <th className="p-3 text-right">
                      Purchase Price
                    </th>

                    <th className="p-3 text-right">
                      GST %
                    </th>

                    <th className="p-3 text-right">
                      Total
                    </th>

                    <th className="p-3 text-center">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {items.map(
                    (
                      item,
                      index
                    ) => {

                      const values =
                        getItemValues(
                          item
                        );

                      return (
                        <tr
                          key={
                            index
                          }
                          className="border-t"
                        >

                          <td className="p-3">

                            <select
                              value={
                                item.product_id
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "product_id",
                                  e.target.value
                                )
                              }
                              className="w-full min-w-[250px] rounded-lg border border-gray-300 px-3 py-2"
                            >

                              <option value="">
                                Select Product
                              </option>

                              {products.map(
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
                                      product.product_code
                                    }{" "}
                                    -{" "}
                                    {
                                      product.product_name
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </td>

                          <td className="p-3">

                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right"
                            />

                          </td>

                          <td className="p-3">

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.purchase_price
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "purchase_price",
                                  e.target.value
                                )
                              }
                              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right"
                            />

                          </td>

                          <td className="p-3">

                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                item.gst_percentage
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "gst_percentage",
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right"
                            />

                          </td>

                          <td className="p-3 text-right font-medium">
                            ₹{" "}
                            {values.total.toFixed(
                              2
                            )}
                          </td>

                          <td className="p-3 text-center">

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              disabled={
                                items.length ===
                                1
                              }
                              className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* TOTALS */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">

            <div>

              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>

              <textarea
                value={
                  notes
                }
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                rows={5}
                placeholder="Purchase notes..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />

            </div>

            <div className="rounded-xl bg-gray-50 p-5">

              {/* SUBTOTAL */}

              <div className="mb-3 flex justify-between">

                <span>
                  Subtotal
                </span>

                <strong>
                  ₹{" "}
                  {subtotal.toFixed(
                    2
                  )}
                </strong>

              </div>

              {/* POSTAGE & COURIER */}

              <div className="mb-3 flex items-center justify-between gap-4">

                <span>
                  Postage &amp; Courier Charges
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    otherCharges
                  }
                  onChange={(e) =>
                    setOtherCharges(
                      e.target.value
                    )
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right"
                />

              </div>

              {/* DISCOUNT */}

              <div className="mb-3 flex items-center justify-between gap-4">

                <span>
                  Discount
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discountAmount
                  }
                  onChange={(e) =>
                    setDiscountAmount(
                      e.target.value
                    )
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right"
                />

              </div>

              {/* TAXABLE AMOUNT */}

              <div className="mb-3 flex justify-between">

                <span>
                  Taxable Amount
                </span>

                <strong>
                  ₹{" "}
                  {taxableAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

              {/* GST */}

              <div className="mb-3 flex justify-between">

                <span>
                  GST
                </span>

                <strong>
                  ₹{" "}
                  {finalGstAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="my-4 border-t" />

              {/* GRAND TOTAL */}

              <div className="mb-4 flex justify-between text-lg font-bold">

                <span>
                  Grand Total
                </span>

                <span>
                  ₹{" "}
                  {grandTotal.toFixed(
                    2
                  )}
                </span>

              </div>

              {/* PAID */}

              <div className="mb-3 flex items-center justify-between gap-4">

                <span>
                  Paid Amount
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    paidAmount
                  }
                  onChange={(e) =>
                    setPaidAmount(
                      e.target.value
                    )
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right"
                />

              </div>

              {/* BALANCE */}

              <div className="flex justify-between text-lg font-bold text-red-600">

                <span>
                  Balance
                </span>

                <span>
                  ₹{" "}
                  {balanceAmount.toFixed(
                    2
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* FORM BUTTONS */}

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={() => {
                setShowForm(
                  false
                );

                resetForm();
              }}
              className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving
              }
              className="rounded-lg bg-blue-600 px-7 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Purchase"
                : "Save Purchase"}
            </button>

          </div>

        </div>
      )}

      {/* PAYMENT MODAL */}

      {showPayment &&
        selectedPurchase && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closePayment();
              }
            }}
          >

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b p-5">

                <div>

                  <h2 className="text-xl font-bold">
                    Vendor Payment
                  </h2>

                  <p className="text-sm text-gray-500">
                    {
                      selectedPurchase.purchase_code
                    }
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {
                      selectedPurchase.vendor
                        ?.company_name ??
                      "Vendor"
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  disabled={
                    paymentSaving
                  }
                  className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✕
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="p-5">

                {/* SUMMARY */}

                <div className="mb-5 grid grid-cols-3 gap-3">

                  <div className="rounded-lg bg-gray-100 p-3">

                    <p className="text-xs text-gray-500">
                      Grand Total
                    </p>

                    <p className="font-bold">
                      ₹{" "}
                      {Number(
                        selectedPurchase.grand_total
                      ).toFixed(
                        2
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg bg-green-50 p-3">

                    <p className="text-xs text-gray-500">
                      Paid
                    </p>

                    <p className="font-bold text-green-700">
                      ₹{" "}
                      {Number(
                        selectedPurchase.paid_amount
                      ).toFixed(
                        2
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg bg-red-50 p-3">

                    <p className="text-xs text-gray-500">
                      Balance
                    </p>

                    <p className="font-bold text-red-700">
                      ₹{" "}
                      {paymentBalance.toFixed(
                        2
                      )}
                    </p>

                  </div>

                </div>

                {/* PAYMENT FORM */}

                <div className="space-y-4">

                  {/* DATE */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Payment Date *
                    </label>

                    <input
                      type="date"
                      value={
                        paymentDate
                      }
                      onChange={(e) =>
                        setPaymentDate(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />

                  </div>

                  {/* AMOUNT */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Payment Amount *
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      max={
                        paymentBalance
                      }
                      step="0.01"
                      value={
                        paymentAmount
                      }
                      onChange={(e) =>
                        setPaymentAmount(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-right text-lg font-semibold"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          paymentBalance.toFixed(
                            2
                          )
                        )
                      }
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Pay Full Balance ₹
                      {paymentBalance.toFixed(
                        2
                      )}
                    </button>

                  </div>

                  {/* PAYMENT MODE */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Payment Mode *
                    </label>

                    <select
                      value={
                        paymentMode
                      }
                      onChange={(e) =>
                        setPaymentMode(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >

                      <option value="Cash">
                        Cash
                      </option>

                      <option value="Bank Transfer">
                        Bank Transfer
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="Cheque">
                        Cheque
                      </option>

                      <option value="Card">
                        Card
                      </option>

                    </select>

                  </div>

                  {/* REFERENCE */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Reference No
                    </label>

                    <input
                      type="text"
                      value={
                        referenceNo
                      }
                      onChange={(e) =>
                        setReferenceNo(
                          e.target.value
                        )
                      }
                      placeholder="Transaction / Cheque / UPI reference"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />

                  </div>

                  {/* NOTES */}

                  <div>

                    <label className="mb-1 block text-sm font-medium">
                      Notes
                    </label>

                    <textarea
                      value={
                        paymentNotes
                      }
                      onChange={(e) =>
                        setPaymentNotes(
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Payment notes..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="flex justify-end gap-3 border-t p-5">

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  disabled={
                    paymentSaving
                  }
                  className="rounded-lg bg-gray-200 px-5 py-2 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handlePayment
                  }
                  disabled={
                    paymentSaving ||
                    paymentBalance <=
                      0
                  }
                  className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentSaving
                    ? "Saving Payment..."
                    : "Save Payment"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* PURCHASE LIST */}

      <div className="overflow-hidden rounded-xl bg-white shadow">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Code
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Vendor
                </th>

                <th className="p-4 text-left">
                  Invoice
                </th>

                <th className="p-4 text-right">
                  Grand Total
                </th>

                <th className="p-4 text-right">
                  Paid
                </th>

                <th className="p-4 text-right">
                  Balance
                </th>

                <th className="p-4 text-center">
                  Payment
                </th>

                <th className="p-4 text-center">
                  Status
                </th>

                <th className="p-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (
                <tr>

                  <td
                    colSpan={10}
                    className="p-8 text-center"
                  >
                    Loading Purchases...
                  </td>

                </tr>
              )}

              {!loading &&
                purchases.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan={10}
                      className="p-8 text-center text-gray-500"
                    >
                      No Purchases Found
                    </td>

                  </tr>
                )}

              {!loading &&
                purchases.map(
                  (purchase) => {

                    const balance =
                      Math.max(
                        Number(
                          purchase.balance_amount
                        ) || 0,
                        0
                      );

                    const status =
                      String(
                        purchase.payment_status ??
                          ""
                      ).toUpperCase();

                    const isPaid =
                      balance <=
                        0 ||
                      status ===
                        "PAID";

                    return (
                      <tr
                        key={
                          purchase.id
                        }
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium">
                          {
                            purchase.purchase_code
                          }
                        </td>

                        <td className="p-4">
                          {
                            purchase.purchase_date
                          }
                        </td>

                        <td className="p-4">
                          {
                            purchase
                              .vendor
                              ?.company_name ??
                            "-"
                          }
                        </td>

                        <td className="p-4">
                          {
                            purchase
                              .supplier_invoice_no ??
                            "-"
                          }
                        </td>

                        <td className="p-4 text-right font-medium">
                          ₹{" "}
                          {Number(
                            purchase.grand_total
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td className="p-4 text-right font-medium text-green-700">
                          ₹{" "}
                          {Number(
                            purchase.paid_amount
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td
                          className={`p-4 text-right font-semibold ${
                            balance >
                            0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{" "}
                          {balance.toFixed(
                            2
                          )}
                        </td>

                        <td className="p-4 text-center">

                          {isPaid ? (

                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ✓ Paid
                            </span>

                          ) : (

                            <button
                              type="button"
                              onClick={() =>
                                openPayment(
                                  purchase
                                )
                              }
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Pay
                            </button>

                          )}

                        </td>

                        <td className="p-4 text-center">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              status ===
                              "PAID"
                                ? "bg-green-100 text-green-700"
                                : status ===
                                  "PARTIAL"
                                ? "bg-yellow-100 text-yellow-700"
                                : status ===
                                    "PENDING" ||
                                  status ===
                                    "UNPAID"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {status ===
                            "PARTIAL"
                              ? "PARTIAL"
                              : status ===
                                "PAID"
                              ? "PAID"
                              : purchase.payment_status ||
                                "PENDING"}
                          </span>

                        </td>

                        <td className="p-4 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                purchase
                              )
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        {!loading &&
          pagination.total >
            0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">

              <div className="text-sm text-gray-500">

                Total Purchases:{" "}

                <strong className="text-gray-700">
                  {
                    pagination.total
                  }
                </strong>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    page <= 1
                  }
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm">

                  Page{" "}

                  <strong>
                    {
                      pagination.current_page
                    }
                  </strong>

                  {" "}of{" "}

                  <strong>
                    {
                      pagination.last_page
                    }
                  </strong>

                </span>

                <button
                  type="button"
                  onClick={
                    handleNext
                  }
                  disabled={
                    page >=
                    pagination.last_page
                  }
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>

              </div>

            </div>
          )}

      </div>

    </div>
  );
}