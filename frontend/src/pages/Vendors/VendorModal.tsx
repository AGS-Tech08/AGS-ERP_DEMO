import VendorForm from "./VendorForm";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Add Vendor
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a new vendor
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100 hover:text-red-600"
            title="Close"
          >
            ×
          </button>

        </div>

        {/* Form */}
        <div className="p-6">
          <VendorForm
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </div>

      </div>
    </div>
  );
}