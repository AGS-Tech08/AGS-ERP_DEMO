import { useState } from "react";
import api from "../../services/api";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export default function VendorForm({
  onSuccess,
  onClose,
}: Props) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    company_type: "",
    gst_number: "",
    pan_number: "",
    contact_person: "",
    designation: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    website: "",
    address: "",
    area: "",
    city: "",
    district: "",
    state: "Tamil Nadu",
    country: "India",
    pincode: "",
    credit_limit: "0",
    vendor_status: "Active",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveVendor = async () => {
    if (!form.company_name.trim()) {
      alert("Company Name is required");
      return;
    }

    if (!form.contact_person.trim()) {
      alert("Contact Person is required");
      return;
    }

    if (!form.mobile.trim()) {
      alert("Mobile Number is required");
      return;
    }

    if (!form.address.trim()) {
      alert("Address is required");
      return;
    }

    if (!form.city.trim()) {
      alert("City is required");
      return;
    }

    if (!form.state.trim()) {
      alert("State is required");
      return;
    }

    try {
      setSaving(true);

      await api.post("/vendors", {
        ...form,
        credit_limit: Number(form.credit_limit || 0),
      });

      alert("Vendor Saved Successfully");

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("Vendor Save Error:", error);

      const errors = error.response?.data?.errors;

      if (errors) {
        const firstError =
          Object.values(errors)[0] as string[];

        alert(firstError?.[0] ?? "Unable to save vendor");
      } else {
        alert(
          error.response?.data?.message ??
            "Unable to save vendor"
        );
      }

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-2">

      {/* Company Details */}
      <div className="mb-6">

        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
          Company Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Company Name *
            </label>

            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="Company Name"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Company Type
            </label>

            <input
              name="company_type"
              value={form.company_type}
              onChange={handleChange}
              placeholder="Manufacturer / Distributor / Supplier"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              GST Number
            </label>

            <input
              name="gst_number"
              value={form.gst_number}
              onChange={handleChange}
              placeholder="GST Number"
              className="w-full rounded-lg border border-gray-300 p-3 uppercase outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              PAN Number
            </label>

            <input
              name="pan_number"
              value={form.pan_number}
              onChange={handleChange}
              placeholder="PAN Number"
              className="w-full rounded-lg border border-gray-300 p-3 uppercase outline-none focus:border-blue-500"
            />
          </div>

        </div>
      </div>


      {/* Contact Details */}
      <div className="mb-6">

        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
          Contact Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Contact Person *
            </label>

            <input
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              placeholder="Contact Person"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Designation
            </label>

            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="Designation"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Mobile *
            </label>

            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Alternate Mobile
            </label>

            <input
              name="alternate_mobile"
              value={form.alternate_mobile}
              onChange={handleChange}
              placeholder="Alternate Mobile"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Website
            </label>

            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="Website"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

        </div>
      </div>


      {/* Address */}
      <div className="mb-6">

        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
          Address
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Address *
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full Address"
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Area
            </label>

            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Area"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              City *
            </label>

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              District
            </label>

            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="District"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              State *
            </label>

            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="State"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Country
            </label>

            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Country"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Pincode
            </label>

            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

        </div>
      </div>


      {/* Financial / Status */}
      <div className="mb-6">

        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
          Financial & Status
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Credit Limit
            </label>

            <input
              name="credit_limit"
              type="number"
              min="0"
              value={form.credit_limit}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Status
            </label>

            <select
              name="vendor_status"
              value={form.vendor_status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

        </div>
      </div>


      {/* Buttons */}
      <div className="flex justify-end gap-3 border-t pt-5">

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg bg-gray-400 px-6 py-2 text-white hover:bg-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveVendor}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Vendor"}
        </button>

      </div>

    </div>
  );
}