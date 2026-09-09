import { useEffect, useState } from "react";
import api from "../../services/api";
import VendorModal from "./VendorModal";

interface Vendor {
  id: number;
  vendor_code?: string;
  company_name?: string;
  company_type?: string;
  gst_number?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  city?: string;
  state?: string;
  credit_limit?: string | number;
  vendor_status?: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");

  const [page, setPage] = useState(1);

  const [openModal, setOpenModal] = useState(false);

  const [pagination, setPagination] =
    useState<Pagination>({
      current_page: 1,
      last_page: 1,
      total: 0,
    });

  /*
  |--------------------------------------------------------------------------
  | Load Vendors
  |--------------------------------------------------------------------------
  */

  const loadVendors = async (
    currentPage = page,
    searchText = search,
    statusText = status,
    cityText = city
  ) => {
    try {
      setLoading(true);

      const response = await api.get("/vendors", {
        params: {
          page: currentPage,
          search: searchText || undefined,
          vendor_status: statusText || undefined,
          city: cityText || undefined,
        },
      });

      console.log(
        "Vendor API Response:",
        response.data
      );

      const result = response.data?.data;

      if (result && Array.isArray(result.data)) {
        setVendors(result.data);

        setPagination({
          current_page: result.current_page ?? 1,
          last_page: result.last_page ?? 1,
          total: result.total ?? 0,
        });
      } else if (Array.isArray(result)) {
        setVendors(result);

        setPagination({
          current_page: 1,
          last_page: 1,
          total: result.length,
        });
      } else {
        setVendors([]);

        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
        });
      }
    } catch (error) {
      console.error(
        "Vendor Load Error:",
        error
      );

      setVendors([]);

      setPagination({
        current_page: 1,
        last_page: 1,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadVendors(1, "", "", "");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearch = () => {
    setPage(1);

    loadVendors(
      1,
      search,
      status,
      city
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Filter
  |--------------------------------------------------------------------------
  */

  const handleClear = () => {
    setSearch("");
    setStatus("");
    setCity("");
    setPage(1);

    loadVendors(1, "", "", "");
  };

  /*
  |--------------------------------------------------------------------------
  | Previous
  |--------------------------------------------------------------------------
  */

  const handlePrevious = () => {
    if (page > 1) {
      const newPage = page - 1;

      setPage(newPage);

      loadVendors(
        newPage,
        search,
        status,
        city
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Next
  |--------------------------------------------------------------------------
  */

  const handleNext = () => {
    if (page < pagination.last_page) {
      const newPage = page + 1;

      setPage(newPage);

      loadVendors(
        newPage,
        search,
        status,
        city
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Vendor
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    vendor: Vendor
  ) => {
    const confirmed = window.confirm(
      `Delete vendor "${vendor.company_name}"?\n\nThis action cannot be undone from the admin panel.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/vendors/${vendor.id}`
      );

      alert(
        "Vendor deleted successfully"
      );

      loadVendors(
        page,
        search,
        status,
        city
      );
    } catch (error: any) {
      console.error(
        "Vendor Delete Error:",
        error
      );

      alert(
        error.response?.data?.message ??
          "Unable to delete vendor"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */

  const handleExport = () => {
    if (vendors.length === 0) {
      alert("No vendors available to export");
      return;
    }

    const headers = [
      "Vendor Code",
      "Company Name",
      "Company Type",
      "GST Number",
      "Contact Person",
      "Mobile",
      "Email",
      "City",
      "State",
      "Credit Limit",
      "Status",
    ];

    const rows = vendors.map(
      (vendor) => [
        vendor.vendor_code ?? "",
        vendor.company_name ?? "",
        vendor.company_type ?? "",
        vendor.gst_number ?? "",
        vendor.contact_person ?? "",
        vendor.mobile ?? "",
        vendor.email ?? "",
        vendor.city ?? "",
        vendor.state ?? "",
        vendor.credit_limit ?? 0,
        vendor.vendor_status ?? "",
      ]
    );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `vendors-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Vendor Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage suppliers, vendors and purchase partners
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
          >
            ↓ Export CSV
          </button>

          <button
            type="button"
            onClick={() =>
              setOpenModal(true)
            }
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            + Add Vendor
          </button>

        </div>

      </div>


      {/* Filters */}
      <div className="mb-5 rounded-xl bg-white p-4 shadow">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search vendor..."
            className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />

          {/* Status */}
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          {/* City */}
          <input
            type="text"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            placeholder="Filter by city..."
            className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />

          {/* Buttons */}
          <div className="flex gap-2">

            <button
              type="button"
              onClick={handleSearch}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Clear
            </button>

          </div>

        </div>

      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Code
                </th>

                <th className="p-4 text-left">
                  Company
                </th>

                <th className="p-4 text-left">
                  Contact
                </th>

                <th className="p-4 text-left">
                  Mobile
                </th>

                <th className="p-4 text-left">
                  GST
                </th>

                <th className="p-4 text-left">
                  City
                </th>

                <th className="p-4 text-right">
                  Credit Limit
                </th>

                <th className="p-4 text-center">
                  Status
                </th>

                <th className="p-4 text-center">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center"
                  >
                    Loading Vendors...
                  </td>
                </tr>
              )}

              {!loading &&
                vendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-gray-500"
                    >
                      No Vendors Found
                    </td>
                  </tr>
                )}

              {!loading &&
                vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-4 font-medium">
                      {vendor.vendor_code ?? "-"}
                    </td>

                    <td className="p-4">

                      <div className="font-medium">
                        {vendor.company_name ?? "-"}
                      </div>

                      {vendor.company_type && (
                        <div className="text-xs text-gray-500">
                          {vendor.company_type}
                        </div>
                      )}

                    </td>

                    <td className="p-4">

                      <div>
                        {vendor.contact_person ?? "-"}
                      </div>

                      {vendor.email && (
                        <div className="text-xs text-gray-500">
                          {vendor.email}
                        </div>
                      )}

                    </td>

                    <td className="p-4">
                      {vendor.mobile ?? "-"}
                    </td>

                    <td className="p-4">
                      {vendor.gst_number ?? "-"}
                    </td>

                    <td className="p-4">
                      {vendor.city ?? "-"}
                    </td>

                    <td className="p-4 text-right">

                      ₹{" "}
                      {Number(
                        vendor.credit_limit ?? 0
                      ).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}

                    </td>

                    <td className="p-4 text-center">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          vendor.vendor_status ===
                          "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {vendor.vendor_status ??
                          "-"}
                      </span>

                    </td>

                    <td className="p-4 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            vendor
                          )
                        }
                        className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}

            </tbody>

          </table>

        </div>


        {/* Pagination */}
        {!loading &&
          pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">

              <div className="text-sm text-gray-500">

                Total Vendors:{" "}

                <strong className="text-gray-700">
                  {pagination.total}
                </strong>

              </div>


              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={page <= 1}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>


                <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm">

                  Page{" "}

                  <strong>
                    {pagination.current_page}
                  </strong>

                  {" "}of{" "}

                  <strong>
                    {pagination.last_page}
                  </strong>

                </span>


                <button
                  type="button"
                  onClick={handleNext}
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


      {/* Add Vendor Modal */}
      <VendorModal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        onSuccess={() =>
          loadVendors(
            1,
            search,
            status,
            city
          )
        }
      />

    </div>
  );
}