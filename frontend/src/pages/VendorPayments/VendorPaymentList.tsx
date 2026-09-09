import { useEffect, useState } from "react";
import api from "../../services/api";

interface Vendor {
  id: number;
  vendor_code?: string | null;
  company_name?: string | null;
}

interface Purchase {
  id: number;
  purchase_code?: string | null;
  grand_total?: number | string | null;
}

interface VendorPayment {
  id: number;
  purchase_id: number;
  vendor_id: number;
  payment_date: string;
  amount: number | string;
  payment_mode: string;
  reference_no?: string | null;
  notes?: string | null;
  purchase?: Purchase | null;
  vendor?: Vendor | null;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

export default function VendorPaymentList() {
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [deleting, setDeleting] = useState<number | null>(null);

  const [vendorId, setVendorId] = useState("");
  const [purchaseId, setPurchaseId] = useState("");

  /*
   * --------------------------------------------------
   * LOAD VENDOR PAYMENTS
   * --------------------------------------------------
   */
  const loadPayments = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await api.get("/vendor-payments", {
        params: {
          vendor_id: vendorId || undefined,
          purchase_id: purchaseId || undefined,
        },
      });

      console.log("Vendor Payments API Response:", response.data);

      const result = response.data;

      /*
       * Backend VendorPaymentController currently returns:
       *
       * [
       *   { ...payment },
       *   { ...payment }
       * ]
       *
       * So this is the main expected format.
       */
      if (Array.isArray(result)) {
        setPayments(result);
        return;
      }

      /*
       * Also support:
       *
       * { data: [...] }
       */
      if (Array.isArray(result?.data)) {
        setPayments(result.data);
        return;
      }

      /*
       * Also support:
       *
       * { data: { data: [...] } }
       */
      if (Array.isArray(result?.data?.data)) {
        setPayments(result.data.data);
        return;
      }

      console.warn(
        "Unexpected Vendor Payment API format:",
        result
      );

      setPayments([]);
      setPageError(
        "Vendor payment API returned an unexpected response format."
      );
    } catch (error) {
      const err = error as ApiError;

      console.error(
        "Vendor Payment Load Error:",
        error
      );

      setPayments([]);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to load vendor payments.";

      setPageError(message);
    } finally {
      setLoading(false);
    }
  };

  /*
   * --------------------------------------------------
   * LOAD VENDORS
   * --------------------------------------------------
   */
  const loadVendors = async () => {
    try {
      const response = await api.get("/vendors");

      console.log(
        "Vendors API Response:",
        response.data
      );

      const result = response.data;

      if (Array.isArray(result)) {
        setVendors(result);
        return;
      }

      if (Array.isArray(result?.data)) {
        setVendors(result.data);
        return;
      }

      if (Array.isArray(result?.data?.data)) {
        setVendors(result.data.data);
        return;
      }

      setVendors([]);
    } catch (error) {
      console.error("Vendor Load Error:", error);
      setVendors([]);
    }
  };

  /*
   * --------------------------------------------------
   * LOAD PURCHASES
   * --------------------------------------------------
   */
  const loadPurchases = async () => {
    try {
      const response = await api.get("/purchases", {
        params: {
          per_page: 1000,
        },
      });

      console.log(
        "Purchases API Response:",
        response.data
      );

      const result = response.data;

      if (Array.isArray(result)) {
        setPurchases(result);
        return;
      }

      if (Array.isArray(result?.data)) {
        setPurchases(result.data);
        return;
      }

      if (Array.isArray(result?.data?.data)) {
        setPurchases(result.data.data);
        return;
      }

      setPurchases([]);
    } catch (error) {
      console.error(
        "Purchase Load Error:",
        error
      );

      setPurchases([]);
    }
  };

  /*
   * --------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------
   */
  useEffect(() => {
    void loadVendors();
    void loadPurchases();
  }, []);

  /*
   * --------------------------------------------------
   * LOAD PAYMENTS WHEN FILTER CHANGES
   * --------------------------------------------------
   */
  useEffect(() => {
    void loadPayments();
  }, [vendorId, purchaseId]);

  /*
   * --------------------------------------------------
   * CLEAR FILTERS
   * --------------------------------------------------
   */
  const handleClear = () => {
    setVendorId("");
    setPurchaseId("");
  };

  /*
   * --------------------------------------------------
   * DELETE PAYMENT
   * --------------------------------------------------
   */
  const handleDelete = async (
    payment: VendorPayment
  ) => {
    const amount = Number(payment.amount) || 0;

    const confirmed = window.confirm(
      `Delete this payment of ₹${amount.toFixed(
        2
      )}?\n\nThe purchase paid amount and balance will be recalculated.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(payment.id);

      await api.delete(
        `/vendor-payments/${payment.id}`
      );

      alert(
        "Vendor payment deleted successfully."
      );

      await loadPayments();
    } catch (error) {
      const err = error as ApiError;

      console.error(
        "Vendor Payment Delete Error:",
        error
      );

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to delete vendor payment.";

      alert(message);
    } finally {
      setDeleting(null);
    }
  };

  /*
   * --------------------------------------------------
   * SUMMARY
   * --------------------------------------------------
   */
  const totalAmount = payments.reduce(
    (sum, payment) =>
      sum + (Number(payment.amount) || 0),
    0
  );

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */
  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage vendor payment history
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPayments()}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {pageError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">
            Unable to load Vendor Payments
          </div>

          <div className="mt-1">
            {pageError}
          </div>

          <button
            type="button"
            onClick={() => void loadPayments()}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="mb-5 rounded-xl bg-white p-5 shadow">
        <div className="grid gap-4 md:grid-cols-3">
          {/* VENDOR */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Vendor
            </label>

            <select
              value={vendorId}
              onChange={(event) =>
                setVendorId(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">
                All Vendors
              </option>

              {vendors.map((vendor) => (
                <option
                  key={vendor.id}
                  value={vendor.id}
                >
                  {vendor.vendor_code
                    ? `${vendor.vendor_code} - `
                    : ""}
                  {vendor.company_name || "Unknown Vendor"}
                </option>
              ))}
            </select>
          </div>

          {/* PURCHASE */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Purchase
            </label>

            <select
              value={purchaseId}
              onChange={(event) =>
                setPurchaseId(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">
                All Purchases
              </option>

              {purchases.map((purchase) => (
                <option
                  key={purchase.id}
                  value={purchase.id}
                >
                  {purchase.purchase_code ||
                    `Purchase #${purchase.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* CLEAR */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-lg bg-gray-200 px-5 py-2 text-gray-700 hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        {/* TOTAL PAYMENTS */}
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Payments
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {payments.length}
          </p>
        </div>

        {/* TOTAL AMOUNT */}
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Paid Amount
          </p>

          <p className="mt-1 text-2xl font-bold text-green-700">
            ₹ {totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Purchase
                </th>

                <th className="p-4 text-left">
                  Vendor
                </th>

                <th className="p-4 text-right">
                  Amount
                </th>

                <th className="p-4 text-center">
                  Payment Mode
                </th>

                <th className="p-4 text-left">
                  Reference
                </th>

                <th className="p-4 text-left">
                  Notes
                </th>

                <th className="p-4 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-gray-500"
                  >
                    Loading Vendor Payments...
                  </td>
                </tr>
              )}

              {/* EMPTY */}
              {!loading &&
                !pageError &&
                payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-500"
                    >
                      No Vendor Payments Found
                    </td>
                  </tr>
                )}

              {/* DATA */}
              {!loading &&
                payments.map((payment) => {
                  const amount =
                    Number(payment.amount) || 0;

                  return (
                    <tr
                      key={payment.id}
                      className="border-t hover:bg-gray-50"
                    >
                      {/* DATE */}
                      <td className="p-4">
                        {payment.payment_date
                          ? String(
                              payment.payment_date
                            ).substring(0, 10)
                          : "-"}
                      </td>

                      {/* PURCHASE */}
                      <td className="p-4 font-medium text-gray-900">
                        {payment.purchase
                          ?.purchase_code ||
                          `#${payment.purchase_id}`}
                      </td>

                      {/* VENDOR */}
                      <td className="p-4">
                        {payment.vendor
                          ?.company_name ||
                          "-"}
                      </td>

                      {/* AMOUNT */}
                      <td className="p-4 text-right font-semibold text-green-700">
                        ₹ {amount.toFixed(2)}
                      </td>

                      {/* PAYMENT MODE */}
                      <td className="p-4 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {payment.payment_mode ||
                            "-"}
                        </span>
                      </td>

                      {/* REFERENCE */}
                      <td className="p-4">
                        {payment.reference_no ||
                          "-"}
                      </td>

                      {/* NOTES */}
                      <td className="max-w-[250px] p-4">
                        {payment.notes || "-"}
                      </td>

                      {/* ACTION */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              payment
                            )
                          }
                          disabled={
                            deleting ===
                            payment.id
                          }
                          className="rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleting ===
                          payment.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}