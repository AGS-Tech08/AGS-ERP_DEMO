import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CustomerList from "../pages/Customers/CustomerList";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;