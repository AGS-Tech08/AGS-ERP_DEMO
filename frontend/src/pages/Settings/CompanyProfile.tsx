import { useEffect, useState } from "react";
import api from "../../services/api";

interface CompanyProfileData {
  company_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website: string;
}

interface BankDetailsData {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  account_type: string;
  upi_id: string;
}

const emptyBankDetails: BankDetailsData = {
  bank_name: "",
  account_holder_name: "",
  account_number: "",
  ifsc_code: "",
  branch: "",
  account_type: "Current",
  upi_id: "",
};

export default function CompanyProfile() {
  const [form, setForm] =
    useState<CompanyProfileData>({
      company_name: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      gstin: "",
      pan: "",
      phone: "",
      email: "",
      website: "",
    });

  const [bankDetails, setBankDetails] =
    useState<BankDetailsData>(emptyBankDetails);

  const [bankAccountId, setBankAccountId] =
    useState<number | null>(null);

  const [bankLoading, setBankLoading] =
    useState(true);

  const [bankSaving, setBankSaving] =
    useState(false);

  const [bankSaved, setBankSaved] =
    useState(false);

  const [bankError, setBankError] =
    useState("");

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Company Profile
  |--------------------------------------------------------------------------
  */

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/company-profile");

      const data =
        response.data?.data;

      if (data) {
        setForm({
          company_name:
            data.company_name ?? "",

          address:
            data.address ?? "",

          city:
            data.city ?? "",

          state:
            data.state ?? "Tamil Nadu",

          pincode:
            data.pincode ?? "",

          gstin:
            data.gstin ?? "",

          pan:
            data.pan ?? "",

          phone:
            data.phone ?? "",

          email:
            data.email ?? "",

          website:
            data.website ?? "",
        });

        /*
        |--------------------------------------------------------------------------
        | Existing Logo
        |--------------------------------------------------------------------------
        */

        if (data.logo_path) {
          const baseURL =
            api.defaults.baseURL?.replace(
              "/api",
              ""
            ) ?? "";

          setLogoPreview(
            data.logo_path.startsWith("http")
              ? data.logo_path
              : `${baseURL}${data.logo_path}`
          );
        }
      }

    } catch (err: any) {
      console.error(
        "Company Profile Load Error:",
        err
      );

      setError(
        err?.response?.data?.message ??
          "Unable to load company profile."
      );

    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  const loadBankDetails = async () => {
    try {
      setBankLoading(true);
      setBankError("");

      const response =
        await api.get("/bank-accounts/active");

      const data =
        response.data?.data;

      const account = Array.isArray(data)
        ? data[0] ?? null
        : data ?? null;

      if (account) {
        setBankAccountId(account.id ?? null);
        setBankDetails({
          bank_name: account.bank_name ?? "",
          account_holder_name:
            account.account_holder_name ?? "",
          account_number:
            account.account_number ?? "",
          ifsc_code: account.ifsc_code ?? "",
          branch: account.branch ?? "",
          account_type:
            account.account_type ?? "Current",
          upi_id: account.upi_id ?? "",
        });
      } else {
        setBankAccountId(null);
        setBankDetails(emptyBankDetails);
      }
    } catch (err: any) {
      console.error(
        "Bank Details Load Error:",
        err
      );

      setBankError(
        err?.response?.data?.message ??
          "Unable to load bank details."
      );
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyProfile();
    loadBankDetails();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Handle Input
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    field: keyof CompanyProfileData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
    setError("");
  };

  const handleBankChange = (
    field: keyof BankDetailsData,
    value: string
  ) => {
    setBankDetails((previous) => ({
      ...previous,
      [field]: value,
    }));

    setBankSaved(false);
    setBankError("");
  };

  const saveBankDetails = async () => {
    setBankSaved(false);
    setBankError("");

    if (
      !bankDetails.bank_name.trim() ||
      !bankDetails.account_holder_name.trim() ||
      !bankDetails.account_number.trim() ||
      !bankDetails.ifsc_code.trim()
    ) {
      setBankError(
        "Bank name, account holder name, account number, and IFSC code are required."
      );
      return;
    }

    try {
      setBankSaving(true);

      const payload = {
        bank_name: bankDetails.bank_name.trim(),
        account_holder_name:
          bankDetails.account_holder_name.trim(),
        account_number:
          bankDetails.account_number.trim(),
        ifsc_code:
          bankDetails.ifsc_code.trim().toUpperCase(),
        branch:
          bankDetails.branch.trim() || null,
        account_type:
          bankDetails.account_type || "Current",
        upi_id:
          bankDetails.upi_id.trim() || null,
        is_active: true,
      };

      if (bankAccountId) {
        const response =
          await api.put(
            `/bank-accounts/${bankAccountId}`,
            payload
          );

        const account = response.data?.data;

        if (account?.id) {
          setBankAccountId(account.id);
        }
      } else {
        const response =
          await api.post(
            "/bank-accounts",
            payload
          );

        const account = response.data?.data;

        if (account?.id) {
          setBankAccountId(account.id);
        }
      }

      setBankSaved(true);
      await loadBankDetails();
    } catch (err: any) {
      console.error(
        "Bank Details Save Error:",
        err
      );

      setBankError(
        err?.response?.data?.message ??
          "Unable to save bank details."
      );
    } finally {
      setBankSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Upload Logo
  |--------------------------------------------------------------------------
  */

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSaved(false);

    /*
    |--------------------------------------------------------------------------
    | Local Preview
    |--------------------------------------------------------------------------
    */

    const previewUrl =
      URL.createObjectURL(file);

    setLogoPreview(previewUrl);


    /*
    |--------------------------------------------------------------------------
    | Upload
    |--------------------------------------------------------------------------
    */

    try {
      setUploadingLogo(true);

      const formData =
        new FormData();

      formData.append(
        "logo",
        file
      );

      const response =
        await api.post(
          "/company-profile/logo",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      /*
      |--------------------------------------------------------------------------
      | Backend Logo URL
      |--------------------------------------------------------------------------
      */

      const logoPath =
        response.data?.data?.logo_path;

      if (logoPath) {
        const baseURL =
          api.defaults.baseURL?.replace(
            "/api",
            ""
          ) ?? "";

        setLogoPreview(
          logoPath.startsWith("http")
            ? logoPath
            : `${baseURL}${logoPath}`
        );
      }

    } catch (err: any) {
      console.error(
        "Logo Upload Error:",
        err
      );

      setError(
        err?.response?.data?.message ??
          "Unable to upload company logo."
      );

    } finally {
      setUploadingLogo(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Save Company Profile
  |--------------------------------------------------------------------------
  */

  const handleSave = async () => {
    setSaved(false);
    setError("");

    if (!form.company_name.trim()) {
      setError(
        "Company name is required."
      );
      return;
    }

    try {
      setSaving(true);

      await api.put(
        "/company-profile",
        {
          company_name:
            form.company_name.trim(),

          address:
            form.address || null,

          city:
            form.city || null,

          state:
            form.state || null,

          pincode:
            form.pincode || null,

          gstin:
            form.gstin || null,

          pan:
            form.pan || null,

          phone:
            form.phone || null,

          email:
            form.email || null,

          website:
            form.website || null,
        }
      );

      setSaved(true);

    } catch (err: any) {
      console.error(
        "Company Profile Save Error:",
        err
      );

      setError(
        err?.response?.data?.message ??
          "Unable to save company profile."
      );

    } finally {
      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="p-6 text-slate-500">
        Loading company profile...
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-5xl">

      {/* Header */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-slate-800">
          Company Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage company information used in
          invoices and business documents.
        </p>

      </div>


      {/* Success */}

      {saved && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Company profile saved successfully.
        </div>
      )}


      {/* Error */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}


      {/* Company Information */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Company Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Company Name */}

          <div className="md:col-span-2">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Company Name
            </label>

            <input
              type="text"
              value={form.company_name}
              onChange={(event) =>
                handleChange(
                  "company_name",
                  event.target.value
                )
              }
              placeholder="Company Name"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* Address */}

          <div className="md:col-span-2">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Address
            </label>

            <textarea
              value={form.address}
              onChange={(event) =>
                handleChange(
                  "address",
                  event.target.value
                )
              }
              rows={3}
              placeholder="Company address"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* City */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              City
            </label>

            <input
              type="text"
              value={form.city}
              onChange={(event) =>
                handleChange(
                  "city",
                  event.target.value
                )
              }
              placeholder="City"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* State */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              State
            </label>

            <input
              type="text"
              value={form.state}
              onChange={(event) =>
                handleChange(
                  "state",
                  event.target.value
                )
              }
              placeholder="State"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* Pincode */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Pincode
            </label>

            <input
              type="text"
              value={form.pincode}
              maxLength={6}
              onChange={(event) =>
                handleChange(
                  "pincode",
                  event.target.value
                )
              }
              placeholder="Pincode"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* GSTIN */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              GSTIN
            </label>

            <input
              type="text"
              value={form.gstin}
              onChange={(event) =>
                handleChange(
                  "gstin",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="GSTIN"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 uppercase outline-none focus:border-blue-500"
            />

          </div>


          {/* PAN */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              PAN
            </label>

            <input
              type="text"
              value={form.pan}
              onChange={(event) =>
                handleChange(
                  "pan",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="PAN"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 uppercase outline-none focus:border-blue-500"
            />

          </div>

        </div>

      </div>


      {/* Contact Information */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Contact Information
        </h2>

        <div className="grid gap-5 md:grid-cols-3">

          {/* Phone */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone
            </label>

            <input
              type="text"
              value={form.phone}
              onChange={(event) =>
                handleChange(
                  "phone",
                  event.target.value
                )
              }
              placeholder="Phone number"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* Email */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                handleChange(
                  "email",
                  event.target.value
                )
              }
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>


          {/* Website */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Website
            </label>

            <input
              type="text"
              value={form.website}
              onChange={(event) =>
                handleChange(
                  "website",
                  event.target.value
                )
              }
              placeholder="www.example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />

          </div>

        </div>

      </div>


      {/* Bank Details */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Bank Details
        </h2>

        {bankSaved && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Bank details saved successfully.
          </div>
        )}

        {bankError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {bankError}
          </div>
        )}

        {bankLoading ? (
          <div className="p-3 text-sm text-slate-500">
            Loading bank details...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Bank Name
              </label>
              <input
                type="text"
                value={bankDetails.bank_name}
                onChange={(event) =>
                  handleBankChange(
                    "bank_name",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Holder Name
              </label>
              <input
                type="text"
                value={bankDetails.account_holder_name}
                onChange={(event) =>
                  handleBankChange(
                    "account_holder_name",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Number
              </label>
              <input
                type="text"
                value={bankDetails.account_number}
                onChange={(event) =>
                  handleBankChange(
                    "account_number",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankDetails.ifsc_code}
                onChange={(event) =>
                  handleBankChange(
                    "ifsc_code",
                    event.target.value.toUpperCase()
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 uppercase outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Branch
              </label>
              <input
                type="text"
                value={bankDetails.branch}
                onChange={(event) =>
                  handleBankChange(
                    "branch",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Type
              </label>
              <select
                value={bankDetails.account_type}
                onChange={(event) =>
                  handleBankChange(
                    "account_type",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="Current">Current</option>
                <option value="Savings">Savings</option>
                <option value="Overdraft">Overdraft</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                UPI ID (optional)
              </label>
              <input
                type="text"
                value={bankDetails.upi_id}
                onChange={(event) =>
                  handleBankChange(
                    "upi_id",
                    event.target.value
                  )
                }
                placeholder="upi@bank"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveBankDetails}
            disabled={bankSaving || bankLoading}
            className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bankSaving ? "Saving..." : "Save Bank Details"}
          </button>
        </div>
      </div>


      {/* Company Logo */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Company Logo
        </h2>

        <div className="flex flex-col gap-5 md:flex-row md:items-center">

          {/* Preview */}

          <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">

            {logoPreview ? (

              <img
                src={logoPreview}
                alt="Company Logo"
                className="max-h-28 max-w-44 object-contain"
              />

            ) : (

              <span className="text-sm text-slate-400">
                No logo selected
              </span>

            )}

          </div>


          {/* Upload */}

          <div>

            <label
              className={`inline-block rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 ${
                uploadingLogo
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-slate-50"
              }`}
            >

              {uploadingLogo
                ? "Uploading..."
                : "Choose Logo"}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleLogoChange
                }
                disabled={uploadingLogo}
                className="hidden"
              />

            </label>

            <p className="mt-2 text-xs text-slate-500">
              PNG, JPG or WEBP. Maximum 2MB.
            </p>

          </div>

        </div>

      </div>


      {/* Save */}

      <div className="flex justify-end">

        <button
          type="button"
          onClick={handleSave}
          disabled={
            saving ||
            uploadingLogo
          }
          className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Company Profile"}
        </button>

      </div>

    </div>
  );
}