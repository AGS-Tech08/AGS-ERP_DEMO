import { useState } from "react";
import api from "../../services/api";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

function CustomerForm({ onSuccess, onClose }: Props) {
  const [form, setForm] = useState({
    customer_code: "",
    company_name: "",
    contact_person: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveCustomer = async () => {
    try {
      await api.post("/customers", form);

      alert("Customer Saved Successfully");

      onSuccess();

      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message ?? "Unable to save customer");
    }
  };

  return (
    <div className="space-y-4">

      <input
        name="customer_code"
        placeholder="Customer Code"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="company_name"
        placeholder="Company Name"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="contact_person"
        placeholder="Contact Person"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="mobile"
        placeholder="Mobile"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="city"
        placeholder="City"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="state"
        placeholder="State"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <input
        name="address"
        placeholder="Address"
        className="w-full border rounded p-3"
        onChange={handleChange}
      />

      <div className="flex justify-end gap-3">

        <button
          onClick={onClose}
          className="px-5 py-2 rounded bg-gray-400 text-white"
        >
          Cancel
        </button>

        <button
          onClick={saveCustomer}
          className="px-5 py-2 rounded bg-blue-600 text-white"
        >
          Save Customer
        </button>

      </div>

    </div>
  );
}

export default CustomerForm;