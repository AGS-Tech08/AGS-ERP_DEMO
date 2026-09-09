import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Customers from "../pages/Customers/Customers";
import ProductList from "../pages/Products/ProductList";
import VendorList from "../pages/Vendors/VendorList";
import PurchaseList from "../pages/Purchases/PurchaseList";
import VendorPaymentList from "../pages/VendorPayments/VendorPaymentList";

import Sales from "../pages/Sales/Sales";
import SaleCreate from "../pages/Sales/SaleCreate";
import SaleDetails from "../pages/Sales/SaleDetails";
import SaleEdit from "../pages/Sales/SaleEdit";

import QuotationList from "../pages/Quotations/QuotationList";
import QuotationCreate from "../pages/Quotations/QuotationCreate";
import QuotationDetails from "../pages/Quotations/QuotationDetails";
import QuotationEdit from "../pages/Quotations/QuotationEdit";
import QuotationPreview from "../pages/Quotations/QuotationPreview";
import QuotationDocument from "../pages/Quotations/QuotationDocument";

import ServiceList from "../pages/Service/ServiceList";
import ServiceCreate from "../pages/Service/ServiceCreate";
import ServiceDetail from "../pages/Service/ServiceDetail";
import ServiceChallan from "../pages/Service/ServiceChallan";
import CustomerReferenceChallan from "../pages/Service/CustomerReferenceChallan";
import FinalServiceChallan from "../pages/Service/FinalServiceChallan";

import CompanyProfile from "../pages/Settings/CompanyProfile";
import BankAccounts from "../pages/Settings/BankAccounts";
import InvoiceNumberSettings from "../pages/Settings/InvoiceNumberSettings";
import RewardSettings from "../pages/Settings/RewardSettings";
import InvoiceTemplates from "../pages/Settings/InvoiceTemplates";
import QuotationTemplates from "../pages/Settings/QuotationTemplates";
import ServiceTemplates from "../pages/Settings/ServiceTemplates";
import AMCList from "../pages/AMC/AMCList";
import AssetList from "../pages/Assets/AssetList";
import CustomerRewards from "../pages/Rewards/CustomerRewards";
import Employees from "../pages/Employees/Employees";
import Departments from "../pages/Employees/Departments";
import EmployeeForm from "../pages/Employees/EmployeeForm";
import EmployeeProfile from "../pages/Employees/EmployeeProfile";
import Tasks from "../pages/Tasks/Tasks";
import TaskForm from "../pages/Tasks/TaskForm";
import Attendance from "../pages/Attendance/Attendance";
import DailyWork from "../pages/DailyWork/DailyWork";
import DailyWorkForm from "../pages/DailyWork/DailyWorkForm";
import Skills from "../pages/Skills/Skills";
import SkillForm from "../pages/Skills/SkillForm";
import Performance from "../pages/Performance/Performance";
import PerformanceForm from "../pages/Performance/PerformanceForm";
import Reports from "../pages/Reports/Reports";
import ReportDashboard from "../pages/Reports/Dashboard";
import EmployeeReports from "../pages/Reports/EmployeeReports";
import AttendanceReports from "../pages/Reports/AttendanceReports";
import TaskReports from "../pages/Reports/TaskReports";
import DailyWorkReports from "../pages/Reports/DailyWorkReports";
import SkillReports from "../pages/Reports/SkillReports";
import PerformanceReports from "../pages/Reports/PerformanceReports";
import ProductivityReports from "../pages/Reports/ProductivityReports";
import SalesReports from "../pages/Reports/SalesReports";
import PurchaseReports from "../pages/Reports/PurchaseReports";
import CustomerReports from "../pages/Reports/CustomerReports";
import VendorReports from "../pages/Reports/VendorReports";
import InventoryReports from "../pages/Reports/InventoryReports";
import ServiceReports from "../pages/Reports/ServiceReports";
import AMCReports from "../pages/Reports/AMCReports";
import AssetReports from "../pages/Reports/AssetReports";
import PaymentReports from "../pages/Reports/PaymentReports";
import RewardReports from "../pages/Reports/RewardReports";
import FinancialSummary from "../pages/Reports/FinancialSummary";
import MonthlyTaxInvoiceGSTReport from "../pages/Reports/MonthlyTaxInvoiceGSTReport";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Customers */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Customers />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProductList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Vendors */}
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VendorList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Purchases */}
      <Route
        path="/purchases"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PurchaseList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Sales List */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Sales />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/quotations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/quotations/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationCreate />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/quotations/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationDetails />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/quotations/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationEdit />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/quotations/:id/preview"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationPreview />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/sales/quotations/:id/document" element={<ProtectedRoute><QuotationDocument /></ProtectedRoute>} />

      {/* Create Sale */}
      <Route
        path="/sales/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SaleCreate />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Sale Details */}
      <Route
        path="/sales/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SaleEdit />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SaleDetails />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Service List */}
      <Route
        path="/service"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Create Service */}
      <Route
        path="/service/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceCreate />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Service Details */}
      <Route
        path="/service/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Service Challan */}
      <Route
        path="/service/:id/challan"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ServiceChallan />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/service/:id/reference-challan" element={<ProtectedRoute><CustomerReferenceChallan /></ProtectedRoute>} />
      <Route path="/service/:id/final-challan" element={<ProtectedRoute><FinalServiceChallan /></ProtectedRoute>} />

      {/* Vendor Payments */}
      <Route
        path="/vendor-payments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VendorPaymentList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* AMC */}
      <Route
        path="/amc"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AMCList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Assets */}
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AssetList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Customer Rewards */}
      <Route
        path="/customers/rewards"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerRewards />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/employees" element={<ProtectedRoute><AppLayout><Employees /></AppLayout></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><AppLayout><Departments /></AppLayout></ProtectedRoute>} />
      <Route path="/employees/new" element={<ProtectedRoute><AppLayout><EmployeeForm /></AppLayout></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><AppLayout><EmployeeProfile /></AppLayout></ProtectedRoute>} />
      <Route path="/employees/:id/edit" element={<ProtectedRoute><AppLayout><EmployeeForm /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks/new" element={<ProtectedRoute><AppLayout><TaskForm /></AppLayout></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AppLayout><Attendance /></AppLayout></ProtectedRoute>} />
      <Route path="/daily-work" element={<ProtectedRoute><AppLayout><DailyWork /></AppLayout></ProtectedRoute>} />
      <Route path="/daily-work/new" element={<ProtectedRoute><AppLayout><DailyWorkForm /></AppLayout></ProtectedRoute>} />
      <Route path="/skills" element={<ProtectedRoute><AppLayout><Skills /></AppLayout></ProtectedRoute>} />
      <Route path="/skills/new" element={<ProtectedRoute><AppLayout><SkillForm /></AppLayout></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><AppLayout><Performance /></AppLayout></ProtectedRoute>} />
      <Route path="/performance/new" element={<ProtectedRoute><AppLayout><PerformanceForm /></AppLayout></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/dashboard" element={<ProtectedRoute><AppLayout><ReportDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/employees" element={<ProtectedRoute><AppLayout><EmployeeReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/attendance" element={<ProtectedRoute><AppLayout><AttendanceReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/tasks" element={<ProtectedRoute><AppLayout><TaskReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/daily-work" element={<ProtectedRoute><AppLayout><DailyWorkReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/skills" element={<ProtectedRoute><AppLayout><SkillReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/performance" element={<ProtectedRoute><AppLayout><PerformanceReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/productivity" element={<ProtectedRoute><AppLayout><ProductivityReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/sales" element={<ProtectedRoute><AppLayout><SalesReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/purchases" element={<ProtectedRoute><AppLayout><PurchaseReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/customers" element={<ProtectedRoute><AppLayout><CustomerReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/vendors" element={<ProtectedRoute><AppLayout><VendorReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/inventory" element={<ProtectedRoute><AppLayout><InventoryReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/service" element={<ProtectedRoute><AppLayout><ServiceReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/amc" element={<ProtectedRoute><AppLayout><AMCReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/assets" element={<ProtectedRoute><AppLayout><AssetReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/payments" element={<ProtectedRoute><AppLayout><PaymentReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/rewards" element={<ProtectedRoute><AppLayout><RewardReports /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/financial-summary" element={<ProtectedRoute><AppLayout><FinancialSummary /></AppLayout></ProtectedRoute>} />
      <Route path="/reports/gst/tax-invoices" element={<ProtectedRoute><AppLayout><MonthlyTaxInvoiceGSTReport /></AppLayout></ProtectedRoute>} />

      {/* Settings / Company Profile */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CompanyProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Settings / Bank Accounts */}
      <Route
        path="/settings/bank-accounts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BankAccounts />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Settings / Invoice Number Settings */}
      <Route
        path="/settings/invoice-numbering"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InvoiceNumberSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Settings / Reward Settings */}
      <Route
        path="/settings/reward-settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RewardSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/invoice-templates"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InvoiceTemplates />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/settings/quotation-templates" element={<ProtectedRoute><AppLayout><QuotationTemplates /></AppLayout></ProtectedRoute>} />
      <Route path="/settings/service-templates" element={<ProtectedRoute><AppLayout><ServiceTemplates /></AppLayout></ProtectedRoute>} />

      {/* Default */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}
