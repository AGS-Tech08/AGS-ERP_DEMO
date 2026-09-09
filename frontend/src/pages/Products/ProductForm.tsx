import { useEffect, useState } from "react";
import api from "../../services/api";

interface Product {
  id: number;
  product_code?: string;
  product_name?: string;
  category?: string;
  brand?: string;
  hsn_code?: string;
  unit?: string;
  purchase_price?: string | number;
  selling_price?: string | number;
  opening_stock?: string | number;
  current_stock?: string | number;
  minimum_stock?: string | number;
  gst_percentage?: string | number;
  product_status?: string;
  description?: string;
}

interface Props {
  product?: Product | null;
  onSuccess: () => void;
  onClose: () => void;
}

interface ProductFormData {
  product_name: string;
  category: string;
  brand: string;
  hsn_code: string;
  unit: string;
  purchase_price: string;
  selling_price: string;
  opening_stock: string;
  current_stock: string;
  minimum_stock: string;
  gst_percentage: string;
  product_status: string;
  description: string;
}

export default function ProductForm({
  product,
  onSuccess,
  onClose,
}: Props) {
  const isEdit = !!product;

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProductFormData>({
    product_name: "",
    category: "",
    brand: "",
    hsn_code: "",
    unit: "PCS",
    purchase_price: "",
    selling_price: "",
    opening_stock: "",
    current_stock: "",
    minimum_stock: "",
    gst_percentage: "",
    product_status: "Active",
    description: "",
  });

  useEffect(() => {
    if (product) {
      setForm({
        product_name: product.product_name ?? "",
        category: product.category ?? "",
        brand: product.brand ?? "",
        hsn_code: product.hsn_code ?? "",
        unit: product.unit ?? "PCS",
        purchase_price:
          product.purchase_price?.toString() ?? "",
        selling_price:
          product.selling_price?.toString() ?? "",
        opening_stock:
          product.opening_stock?.toString() ?? "",
        current_stock:
          product.current_stock?.toString() ?? "",
        minimum_stock:
          product.minimum_stock?.toString() ?? "",
        gst_percentage:
          product.gst_percentage?.toString() ?? "",
        product_status:
          product.product_status ?? "Active",
        description:
          product.description ?? "",
      });
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProduct = async () => {
    if (!form.product_name.trim()) {
      alert("Please enter Product Name");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        product_name: form.product_name.trim(),

        category:
          form.category.trim() || null,

        brand:
          form.brand.trim() || null,

        hsn_code:
          form.hsn_code.trim() || null,

        unit:
          form.unit || "PCS",

        purchase_price:
          form.purchase_price === ""
            ? 0
            : Number(form.purchase_price),

        selling_price:
          form.selling_price === ""
            ? 0
            : Number(form.selling_price),

        opening_stock:
          form.opening_stock === ""
            ? 0
            : Number(form.opening_stock),

        current_stock:
          form.current_stock === ""
            ? 0
            : Number(form.current_stock),

        minimum_stock:
          form.minimum_stock === ""
            ? 0
            : Number(form.minimum_stock),

        gst_percentage:
          form.gst_percentage === ""
            ? 0
            : Number(form.gst_percentage),

        product_status:
          form.product_status,

        description:
          form.description.trim() || null,
      };

      console.log(
        "Product Payload:",
        payload
      );

      let response;

      if (isEdit && product?.id) {
        response = await api.put(
          `/products/${product.id}`,
          payload
        );
      } else {
        response = await api.post(
          "/products",
          payload
        );
      }

      console.log(
        "Product Response:",
        response.data
      );

      alert(
        response.data?.message ??
          (isEdit
            ? "Product Updated Successfully"
            : "Product Saved Successfully")
      );

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error(
        "Product Save Error:",
        error
      );

      if (error.response?.status === 422) {
        const errors =
          error.response?.data?.errors;

        if (errors) {
          const messages = Object.values(errors)
            .flat()
            .join("\n");

          alert(messages);
        } else {
          alert(
            error.response?.data?.message ??
              "Validation failed"
          );
        }
      } else {
        alert(
          error.response?.data?.message ??
            "Unable to save product"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Product Name */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Product Name *
        </label>

        <input
          name="product_name"
          value={form.product_name}
          onChange={handleChange}
          placeholder="Enter product name"
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Product Code */}
      {product?.product_code && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Product Code
          </label>

          <input
            value={product.product_code}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-100 p-3 text-gray-500"
          />
        </div>
      )}

      {/* Category + Brand */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <div>
          <label className="mb-1 block text-sm font-medium">
            Category
          </label>

          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Brand
          </label>

          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* HSN + Unit + GST */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div>
          <label className="mb-1 block text-sm font-medium">
            HSN Code
          </label>

          <input
            name="hsn_code"
            value={form.hsn_code}
            onChange={handleChange}
            placeholder="Enter HSN Code"
            maxLength={20}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Unit
          </label>

          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          >
            <option value="PCS">PCS</option>
            <option value="NOS">NOS</option>
            <option value="BOX">BOX</option>
            <option value="SET">SET</option>
            <option value="KG">KG</option>
            <option value="LTR">LTR</option>
            <option value="MTR">MTR</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            GST %
          </label>

          <input
            type="number"
            name="gst_percentage"
            value={form.gst_percentage}
            onChange={handleChange}
            placeholder="0"
            min="0"
            max="100"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* Status */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Status
        </label>

        <select
          name="product_status"
          value={form.product_status}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
        >
          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </select>
      </div>

      {/* Pricing */}
      <div className="rounded-lg bg-slate-50 p-4">

        <h3 className="mb-3 font-semibold">
          Pricing
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Purchase Price
            </label>

            <input
              type="number"
              name="purchase_price"
              value={form.purchase_price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Selling Price
            </label>

            <input
              type="number"
              name="selling_price"
              value={form.selling_price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            />
          </div>

        </div>

      </div>

      {/* Stock */}
      <div className="rounded-lg bg-slate-50 p-4">

        <h3 className="mb-3 font-semibold">
          Stock
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Opening Stock
            </label>

            <input
              type="number"
              name="opening_stock"
              value={form.opening_stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.001"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Current Stock
            </label>

            <input
              type="number"
              name="current_stock"
              value={form.current_stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.001"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Minimum Stock
            </label>

            <input
              type="number"
              name="minimum_stock"
              value={form.minimum_stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.001"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
            />
          </div>

        </div>

      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Description
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Product description"
          rows={3}
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 border-t pt-4">

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg bg-gray-400 px-5 py-2 text-white hover:bg-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveProduct}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : isEdit
            ? "Update Product"
            : "Save Product"}
        </button>

      </div>

    </div>
  );
}