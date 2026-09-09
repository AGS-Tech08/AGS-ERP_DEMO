import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

interface ServiceChallan {
  id: number;
  service_number: string;
  entry_date: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  customer: {
    company_name: string;
    contact_person: string;
    phone: string;
    address: string;
    city: string;
  };
  asset?: {
    asset_code: string;
    device_type: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  device_type: string;
  brand: string;
  model: string;
  serial_number: string;
  customer_complaint: string;
  technician_diagnosis: string;
  work_done: string;
  final_remarks: string;
  accessories: any[];
  spares: any[];
  labour_charge: number;
  spare_charge: number;
  other_charge: number;
  discount_amount: number;
  taxable_amount: number;
  gst_percent: number;
  gst_amount: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  assigned_technician?: any;
  status: string;
  delivery_info?: {
    delivered_to: string;
    delivered_by: string;
    customer_acknowledgement: string;
  };
}

export default function ServiceChallan() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  useEffect(() => {
    loadService();
    loadCompanyProfile();
  }, [id]);

  const loadService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data.data);
    } catch (error) {
      console.error("Error loading service:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyProfile = async () => {
    try {
      const response = await api.get("/company-profile");
      setCompanyProfile(response.data.data);
    } catch (error) {
      console.error("Error loading company profile:", error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!service) {
    return <div className="text-center p-8 text-red-600">Service not found</div>;
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      <style>{`
        @media print {
          body { margin: 0; }
          .print-container { margin: 0; padding: 0; }
          .no-print { display: none; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      <div className="print-container">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold">SERVICE JOB CARD</h1>
          {companyProfile && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">{companyProfile.company_name}</p>
              <p>{companyProfile.address}</p>
              <p>{companyProfile.phone} | {companyProfile.email}</p>
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <p className="font-semibold text-gray-600">Service Number</p>
            <p className="text-lg font-bold">{service.service_number}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Entry Date</p>
            <p>{new Date(service.entry_date).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Expected Delivery</p>
            <p>{new Date(service.expected_delivery_date).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Status</p>
            <p className="font-semibold text-blue-600">{service.status}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="font-bold text-lg mb-3">Customer Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-600">Company Name</p>
              <p>{service.customer?.company_name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Contact Person</p>
              <p>{service.customer?.contact_person}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Phone</p>
              <p>{service.customer?.phone}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">City</p>
              <p>{service.customer?.city}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold text-gray-600">Address</p>
              <p>{service.customer?.address}</p>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="font-bold text-lg mb-3">Device Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-600">Device Type</p>
              <p>{service.device_type || service.asset?.device_type}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Brand</p>
              <p>{service.brand || service.asset?.brand}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Model</p>
              <p>{service.model || service.asset?.model}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Serial Number</p>
              <p>{service.serial_number || service.asset?.serial_number}</p>
            </div>
            {service.asset?.asset_code && (
              <div>
                <p className="font-semibold text-gray-600">Asset Code</p>
                <p>{service.asset.asset_code}</p>
              </div>
            )}
          </div>
        </div>

        {/* Accessories */}
        {service.accessories && service.accessories.length > 0 && (
          <div className="mb-6 border-t border-b border-gray-300 py-4">
            <h2 className="font-bold text-lg mb-3">Accessories Received</h2>
            <div className="flex flex-wrap gap-2">
              {service.accessories.map((acc: any) => (
                <span key={acc.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                  {acc.accessory}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="font-bold text-lg mb-3">Service Details</h2>
          <div className="text-sm space-y-3">
            <div>
              <p className="font-semibold text-gray-600">Customer Complaint</p>
              <p className="whitespace-pre-wrap">{service.customer_complaint}</p>
            </div>
            {service.technician_diagnosis && (
              <div>
                <p className="font-semibold text-gray-600">Technician Diagnosis</p>
                <p className="whitespace-pre-wrap">{service.technician_diagnosis}</p>
              </div>
            )}
            {service.work_done && (
              <div>
                <p className="font-semibold text-gray-600">Work Done</p>
                <p className="whitespace-pre-wrap">{service.work_done}</p>
              </div>
            )}
            {service.final_remarks && (
              <div>
                <p className="font-semibold text-gray-600">Final Remarks</p>
                <p className="whitespace-pre-wrap">{service.final_remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Spares Used */}
        {service.spares && service.spares.length > 0 && (
          <div className="mb-6 border-t border-b border-gray-300 py-4">
            <h2 className="font-bold text-lg mb-3">Spares/Materials Used</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {service.spares.map((spare: any) => (
                  <tr key={spare.id} className="border-b border-gray-300">
                    <td className="py-2">{spare.product?.product_name}</td>
                    <td className="text-right">{spare.quantity}</td>
                    <td className="text-right">₹{Number(spare.rate || 0).toLocaleString("en-IN")}</td>
                    <td className="text-right">₹{Number(spare.total_amount || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Charges Summary */}
        <div className="mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="font-bold text-lg mb-3">Charges Summary</h2>
          <table className="w-full text-sm mb-4">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-semibold">Labour Charge</td>
                <td className="text-right">₹{Number(service.labour_charge || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-semibold">Spare Charge</td>
                <td className="text-right">₹{Number(service.spare_charge || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-semibold">Other Charge</td>
                <td className="text-right">₹{Number(service.other_charge || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-semibold">Discount</td>
                <td className="text-right">-₹{Number(service.discount_amount || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b-2 border-gray-800">
                <td className="py-2 font-semibold">Taxable Amount</td>
                <td className="text-right font-semibold">₹{Number(service.taxable_amount || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-semibold">GST ({service.gst_percent}%)</td>
                <td className="text-right">₹{Number(service.gst_amount || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b-2 border-gray-800">
                <td className="py-2 font-bold text-lg">Grand Total</td>
                <td className="text-right font-bold text-lg">₹{Number(service.grand_total || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-4 text-sm mt-4">
            <div>
              <p className="font-semibold text-gray-600">Paid Amount</p>
              <p className="text-lg">₹{Number(service.paid_amount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Balance Amount</p>
              <p className="text-lg">₹{Number(service.balance_amount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Technician</p>
              <p>{service.assigned_technician?.name || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-8 pt-6">
          <div className="grid grid-cols-3 gap-8 text-center text-sm">
            <div>
              <p className="h-12 border-t-2 border-gray-800 pt-2">Received By</p>
              <p className="mt-2 text-gray-600">Date: ___________</p>
            </div>
            <div>
              <p className="h-12 border-t-2 border-gray-800 pt-2">Technician</p>
              <p className="mt-2 text-gray-600">Date: ___________</p>
            </div>
            <div>
              <p className="h-12 border-t-2 border-gray-800 pt-2">Delivered By</p>
              <p className="mt-2 text-gray-600">Date: ___________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
          <p>This is a computer-generated document. No signature required.</p>
          <p>For any queries, please contact our support team.</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="no-print mt-6 flex gap-2 justify-center">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          🖨️ Print Challan
        </button>
      </div>
    </div>
  );
}
