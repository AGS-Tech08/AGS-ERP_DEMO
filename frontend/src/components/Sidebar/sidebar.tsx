import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const menus = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Customers", path: "/customers" },
    { name: "Products", path: "/products" },
    { name: "Sales", path: "/sales" },
    { name: "Purchase", path: "/purchase" },
    { name: "Inventory", path: "/inventory" },
    { name: "Service", path: "/service" },
    { name: "AMC", path: "/amc" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white fixed left-0 top-0">

      <div className="text-2xl font-bold p-5 border-b border-slate-700">
        AGS ERP
      </div>

      <div className="mt-4">

        {menus.map((menu) => (

          <Link
            key={menu.path}
            to={menu.path}
            className={`block px-5 py-3 hover:bg-slate-800 ${
              location.pathname === menu.path
                ? "bg-blue-600"
                : ""
            }`}
          >
            {menu.name}
          </Link>

        ))}

      </div>

    </div>
  );
}

export default Sidebar;