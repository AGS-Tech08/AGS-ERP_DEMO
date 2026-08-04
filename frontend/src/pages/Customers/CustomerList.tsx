import { useEffect, useState } from "react";
import api from "../../services/api";
import CustomerModal from "./CustomerModal";

interface Customer {
  id: number;
  customer_code: string;
  company_name: string;
  contact_person: string;
  mobile: string;
  city: string;
}

function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/customers");

      setCustomers(response.data.data);
    } catch (error) {
      console.error(error);
      alert("Unable to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="p-8">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Customer Management
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          + Add Customer
        </button>

      </div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">City</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan={5} className="text-center p-6">
                  Loading...
                </td>
              </tr>

            ) : customers.length === 0 ? (

              <tr>
                <td colSpan={5} className="text-center p-6">
                  No Customers Found
                </td>
              </tr>

            ) : (

              customers.map((customer) => (

                <tr key={customer.id} className="border-t">

                  <td className="p-3">{customer.customer_code}</td>
                  <td className="p-3">{customer.company_name}</td>
                  <td className="p-3">{customer.contact_person}</td>
                  <td className="p-3">{customer.mobile}</td>
                  <td className="p-3">{customer.city}</td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      <CustomerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={loadCustomers}
      />

    </div>
  );
}

export default CustomerList;