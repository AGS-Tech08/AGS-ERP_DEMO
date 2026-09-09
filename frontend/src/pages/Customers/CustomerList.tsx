import { useEffect, useState } from "react";
import api from "../../services/api";
import CustomerModal from "./CustomerModal";

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
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  const [openModal, setOpenModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const loadCustomers = async (
    currentPage = page,
    searchText = search
  ) => {
    try {
      setLoading(true);

      const response = await api.get("/customers", {
        params: {
          page: currentPage,
          search: searchText || undefined,
        },
      });

      console.log("Customer API Response:", response.data);

      const result = response.data?.data;

      if (result && Array.isArray(result.data)) {
        setCustomers(result.data);

        setPagination({
          current_page: result.current_page ?? 1,
          last_page: result.last_page ?? 1,
          total: result.total ?? 0,
          per_page: result.per_page ?? 10,
        });
      } else if (Array.isArray(result)) {
        setCustomers(result);

        setPagination({
          current_page: 1,
          last_page: 1,
          total: result.length,
          per_page: 10,
        });
      } else if (Array.isArray(response.data)) {
        setCustomers(response.data);

        setPagination({
          current_page: 1,
          last_page: 1,
          total: response.data.length,
          per_page: 10,
        });
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Customer Load Error:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1, "");
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadCustomers(1, search);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
    loadCustomers(1, "");
  };

  const handlePrevious = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      loadCustomers(newPage, search);
    }
  };

  const handleNext = () => {
    if (page < pagination.last_page) {
      const newPage = page + 1;
      setPage(newPage);
      loadCustomers(newPage, search);
    }
  };

  const openCreate = () => {
    setSelectedCustomer(null);
    setOpenModal(true);
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedCustomer(null);
  };

  const handleSuccess = async () => {
    closeModal();
    await loadCustomers(page, search);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Customer Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customers
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          + Add Customer
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-5 rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search customer..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={handleSearch}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* CUSTOMER TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">
                  Code
                </th>

                <th className="p-4 text-left">
                  Company Name
                </th>

                <th className="p-4 text-left">
                  Contact Person
                </th>

                <th className="p-4 text-left">
                  Mobile
                </th>

                <th className="p-4 text-left">
                  Email
                </th>

                <th className="p-4 text-left">
                  City
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
                    colSpan={7}
                    className="p-8 text-center"
                  >
                    Loading Customers...
                  </td>
                </tr>
              )}

              {!loading &&
                customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      No Customers Found
                    </td>
                  </tr>
                )}

              {!loading &&
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {customer.customer_code ?? "-"}
                    </td>

                    <td className="p-4">
                      {customer.company_name ?? "-"}
                    </td>

                    <td className="p-4">
                      {customer.contact_person ?? "-"}
                    </td>

                    <td className="p-4">
                      {customer.mobile ?? "-"}
                    </td>

                    <td className="p-4">
                      {customer.email ?? "-"}
                    </td>

                    <td className="p-4">
                      {customer.city ?? "-"}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(customer)
                        }
                        className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading &&
          pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
              <div className="text-sm text-gray-500">
                Total Customers:{" "}
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
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {pagination.last_page}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    page >= pagination.last_page
                  }
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
      </div>

      {/* CUSTOMER MODAL */}
      <CustomerModal
        open={openModal}
        onClose={closeModal}
        onSuccess={handleSuccess}
        customer={selectedCustomer}
      />
    </div>
  );
}