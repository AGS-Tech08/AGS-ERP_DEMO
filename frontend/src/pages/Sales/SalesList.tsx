import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Edit,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react";
import api from "../../services/api";

interface Sale {
  id: number;
  invoice_no: string;
  sale_date: string;
  grand_total: string;
  paid_amount: string;
  balance_amount: string;
  payment_status: string;
  invoice_type?: "normal" | "tax" | string;
  customer?: {
    customer_code: string;
    company_name: string;
  };
}

interface SalesResponse {
  data?: Sale[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

type InvoiceFilter = "all" | "normal" | "tax";

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [invoiceFilter, setInvoiceFilter] =
    useState<InvoiceFilter>("all");

  const [error, setError] = useState("");

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string> = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (invoiceFilter !== "all") {
        params.invoice_type = invoiceFilter;
      }

      const response = await api.get<SalesResponse>("/sales", {
        params,
      });

      setSales(response.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load sales:", err);
      setError("Unable to load sales data.");
      setSales([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSales();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, invoiceFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSales();
  };

  const formatAmount = (amount: string | number | undefined) => {
    const value = Number(amount ?? 0);

    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInvoiceType = (sale: Sale) => {
    const type = String(sale.invoice_type ?? "tax").toLowerCase();

    if (type === "normal") {
      return {
        label: "Normal",
        className: "bg-slate-100 text-slate-700",
      };
    }

    return {
      label: "Tax",
      className: "bg-blue-100 text-blue-700",
    };
  };

  const filteredSales = useMemo(() => {
    return sales;
  }, [sales]);

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sales
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage sales invoices, payments and customer transactions
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/sales/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} />
            New Sale
          </Link>

        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice or customer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* Invoice Type */}
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => setInvoiceFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                invoiceFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setInvoiceFilter("normal")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                invoiceFilter === "normal"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Normal Invoice
            </button>

            <button
              type="button"
              onClick={() => setInvoiceFilter("tax")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                invoiceFilter === "tax"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Tax Invoice
            </button>

          </div>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Paid
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Balance
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading sales...
                  </td>
                </tr>

              ) : filteredSales.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">

                      <div className="mb-3 rounded-full bg-slate-100 p-4">
                        <FileText
                          size={26}
                          className="text-slate-400"
                        />
                      </div>

                      <p className="font-medium text-slate-700">
                        No sales found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing the search or invoice filter.
                      </p>

                    </div>
                  </td>
                </tr>

              ) : (

                filteredSales.map((sale) => {

                  const invoiceType = getInvoiceType(sale);

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >

                      {/* Invoice */}
                      <td className="px-5 py-4">

                        <Link
                          to={`/sales/${sale.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {sale.invoice_no}
                        </Link>

                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(sale.sale_date)}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-slate-800">
                          {sale.customer?.company_name ??
                            "Walk-in Customer"}
                        </div>

                        {sale.customer?.customer_code && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {sale.customer.customer_code}
                          </div>
                        )}

                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 text-center">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${invoiceType.className}`}
                        >
                          {invoiceType.label}
                        </span>

                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right font-semibold text-slate-800">
                        ₹ {formatAmount(sale.grand_total)}
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 text-right font-medium text-green-600">
                        ₹ {formatAmount(sale.paid_amount)}
                      </td>

                      {/* Balance */}
                      <td className="px-5 py-4 text-right font-medium text-red-600">
                        ₹ {formatAmount(sale.balance_amount)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            sale.payment_status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : sale.payment_status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {sale.payment_status}
                        </span>

                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <Link
                            to={`/sales/${sale.id}`}
                            title="View Sale"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Eye size={16} />
                          </Link>

                          <Link
                            to={`/sales/${sale.id}/edit`}
                            title="Edit Sale"
                            className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit size={16} />
                          </Link>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}