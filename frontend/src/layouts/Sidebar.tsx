import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Boxes,
  Wrench,
  FileText,
  Settings,
  ShoppingCart,
  WalletCards,
  Receipt,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menus = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
    },
    {
      name: "Vendors",
      path: "/vendors",
      icon: Truck,
    },
    {
      name: "Purchases",
      path: "/purchases",
      icon: ShoppingCart,
    },
    {
      name: "Sales",
      path: "/sales",
      icon: Receipt,
    },
    {
      name: "Vendor Payments",
      path: "/vendor-payments",
      icon: WalletCards,
    },
    {
      name: "Assets",
      path: "/assets",
      icon: Boxes,
    },
    {
      name: "Service",
      path: "/service",
      icon: Wrench,
    },
    {
      name: "AMC",
      path: "/amc",
      icon: FileText,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white">
      {/* Logo */}
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold">
          AGS ONE
        </h1>

        <p className="text-sm text-slate-400">
          ERP Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;

          const active =
            location.pathname === menu.path ||
            location.pathname.startsWith(
              `${menu.path}/`
            );

          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />

              <span>{menu.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}