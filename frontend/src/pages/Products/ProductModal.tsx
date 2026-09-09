import ProductForm from "./ProductForm";

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
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({
  open,
  product,
  onClose,
  onSuccess,
}: Props) {
  if (!open) {
    return null;
  }

  const isEdit = !!product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isEdit
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEdit
                ? `Update ${
                    product?.product_code ??
                    "product"
                  }`
                : "Create a new product"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
          >
            ×
          </button>

        </div>

        <div className="p-6">

          <ProductForm
            product={product}
            onSuccess={onSuccess}
            onClose={onClose}
          />

        </div>

      </div>

    </div>
  );
}