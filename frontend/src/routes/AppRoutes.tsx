import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CustomerList from "../pages/Customers/CustomerList";

import SalesList from "../pages/Sales/SalesList";
import SaleCreate from "../pages/Sales/SaleCreate";
import SaleDetails from "../pages/Sales/SaleDetails";
import SaleEdit from "../pages/Sales/SaleEdit";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/customers" element={<CustomerList />} />

      <Route path="/sales" element={<SalesList />} />
      <Route path="/sales/create" element={<SaleCreate />} />

      <Route
        path="/sales/:id/edit"
        element={<SaleEdit />}
      />

      <Route
        path="/sales/:id"
        element={<SaleDetails />}
      />

    </Routes>
  );
}

export default AppRoutes;