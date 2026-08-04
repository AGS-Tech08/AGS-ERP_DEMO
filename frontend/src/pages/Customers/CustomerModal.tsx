import CustomerForm from "./CustomerForm";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CustomerModal({ open, onClose, onSuccess }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl shadow-xl w-[700px] p-6">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-2xl font-bold">
            Add Customer
          </h2>

          <button
            onClick={onClose}
            className="text-red-600 text-xl"
          >
            ✕
          </button>

        </div>

        <CustomerForm
          onSuccess={onSuccess}
          onClose={onClose}
        />

      </div>

    </div>
  );
}

export default CustomerModal;