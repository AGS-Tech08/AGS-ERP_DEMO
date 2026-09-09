import CustomerForm from "./CustomerForm";

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
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

export default function CustomerModal({
  open,
  onClose,
  onSuccess,
  customer,
}: Props) {
  if (!open) {
    return null;
  }

  const isEdit = !!customer?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[700px] rounded-xl bg-white p-6 shadow-xl">
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit
              ? "Edit Customer"
              : "Add Customer"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-600"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <CustomerForm
          customer={customer}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}