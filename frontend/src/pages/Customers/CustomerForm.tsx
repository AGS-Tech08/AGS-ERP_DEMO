import {
  useEffect,
  useState,
} from "react";
import api from "../../services/api";

interface Customer {
  id?: number;
  customer_code?: string;
  company_name?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface Props {
  customer?: Customer | null;
  onSuccess: () => void;
  onClose: () => void;
}

const emptyForm: Customer = {
  company_name: "",
  contact_person: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
};

export default function CustomerForm({
  customer,
  onSuccess,
  onClose,
}: Props) {
  const [form, setForm] =
    useState<Customer>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id,
        customer_code:
          customer.customer_code ?? "",
        company_name:
          customer.company_name ?? "",
        contact_person:
          customer.contact_person ?? "",
        mobile:
          customer.mobile ?? "",
        email:
          customer.email ?? "",
        address:
          customer.address ?? "",
        city:
          customer.city ?? "",
        state:
          customer.state ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [customer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveCustomer = async () => {
    try {
      setSaving(true);

      const payload = {
        company_name:
          form.company_name ?? "",

        contact_person:
          form.contact_person ?? "",

        mobile:
          form.mobile ?? "",

        email:
          form.email ?? "",

        address:
          form.address ?? "",

        city:
          form.city ?? "",

        state:
          form.state ?? "",
      };

      if (customer?.id) {
        await api.put(
          `/customers/${customer.id}`,
          payload
        );

        alert(
          "Customer Updated Successfully"
        );
      } else {
        await api.post(
          "/customers",
          payload
        );

        alert(
          "Customer Created Successfully"
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error(
        "Customer Save Error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to save customer.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* FORM */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* COMPANY */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Company Name
          </label>

          <input
            type="text"
            name="company_name"
            value={form.company_name ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Company Name"
          />
        </div>

        {/* CONTACT PERSON */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Contact Person
          </label>

          <input
            type="text"
            name="contact_person"
            value={form.contact_person ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Contact Person"
          />
        </div>

        {/* MOBILE */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Mobile
          </label>

          <input
            type="text"
            name="mobile"
            value={form.mobile ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Mobile Number"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Email Address"
          />
        </div>

        {/* CITY */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            City
          </label>

          <input
            type="text"
            name="city"
            value={form.city ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="City"
          />
        </div>

        {/* STATE */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            State
          </label>

          <input
            type="text"
            name="state"
            value={form.state ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="State"
          />
        </div>

        {/* ADDRESS */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Address
          </label>

          <input
            type="text"
            name="address"
            value={form.address ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Address"
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg bg-gray-200 px-5 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveCustomer}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : customer?.id
            ? "Update Customer"
            : "Save Customer"}
        </button>
      </div>
    </div>
  );
}