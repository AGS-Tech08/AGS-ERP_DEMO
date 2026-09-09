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
  Gift,
  UserCog,
  ClipboardList,
  CalendarCheck,
  FileBarChart,
  Target,
} from "lucide-react";

type MenuChild = {
  name: string;
  path: string;
  icon?: typeof Boxes;
  children?: MenuChild[];
};

type MenuItem = {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  children?: MenuChild[];
};

export default function Sidebar() {
  const location = useLocation();

  const isPathActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  const menus: MenuItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
      children: [
        {
          name: "Customer Rewards",
          path: "/customers/rewards",
          icon: Gift,
        },
      ],
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
      children: [
        {
          name: "Vendor Payments",
          path: "/vendor-payments",
          icon: WalletCards,
        },
      ],
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
      children: [
        {
          name: "Quotations",
          path: "/sales/quotations",
          icon: FileText,
        },
      ],
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
      children: [
        {
          name: "Assets",
          path: "/assets",
          icon: Boxes,
        },
      ],
    },
    {
      name: "Employee Management",
      path: "/employees",
      icon: UserCog,
      children: [
        {
          name: "Employees",
          path: "/employees",
          icon: Users,
        },
        {
          name: "Departments",
          path: "/departments",
          icon: Boxes,
        },
        {
          name: "Attendance",
          path: "/attendance",
          icon: CalendarCheck,
        },
        {
          name: "Tasks",
          path: "/tasks",
          icon: ClipboardList,
        },
        {
          name: "Daily Work",
          path: "/daily-work",
          icon: FileText,
        },
        {
          name: "Skills",
          path: "/skills",
          icon: Target,
        },
        {
          name: "Performance",
          path: "/performance",
          icon: FileBarChart,
        },
      ],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileBarChart,
      children: [
        {
          name: "Dashboard",
          path: "/reports/dashboard",
        },
        {
          name: "Sales",
          path: "/reports/sales",
        },
        {
          name: "Purchase",
          path: "/reports/purchases",
        },
        {
          name: "Customers",
          path: "/reports/customers",
        },
        {
          name: "Vendors",
          path: "/reports/vendors",
        },
        {
          name: "Inventory",
          path: "/reports/inventory",
        },
        {
          name: "Service",
          path: "/reports/service",
        },
        {
          name: "AMC",
          path: "/reports/amc",
        },
        {
          name: "Assets",
          path: "/reports/assets",
        },
        {
          name: "Payments",
          path: "/reports/payments",
        },
        {
          name: "Employees",
          path: "/reports/employees",
        },
        {
          name: "Attendance",
          path: "/reports/attendance",
        },
        {
          name: "Tasks",
          path: "/reports/tasks",
        },
        {
          name: "Daily Work",
          path: "/reports/daily-work",
        },
        {
          name: "Skills",
          path: "/reports/skills",
        },
        {
          name: "Performance",
          path: "/reports/performance",
        },
        {
          name: "Rewards",
          path: "/reports/rewards",
        },
        {
          name: "Financial Summary",
          path: "/reports/financial-summary",
        },
        {
          name: "GST Reports",
          path: "/reports/gst/tax-invoices",
          children: [
            {
              name: "Monthly Tax Invoice GST Report",
              path: "/reports/gst/tax-invoices",
            },
          ],
        },
      ],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      exact: true,
      children: [
        {
          name: "Company Profile Settings",
          path: "/settings",
          children: [
            {
              name: "Invoice Settings",
              path: "/settings/invoice-numbering",
            },
            {
              name: "Invoice Templates",
              path: "/settings/invoice-templates",
            },
            {
              name: "Quotation Templates",
              path: "/settings/quotation-templates",
            },
            {
              name: "Service Templates",
              path: "/settings/service-templates",
            },
            {
              name: "Reward Settings",
              path: "/settings/reward-settings",
            },
          ],
        },
      ],
    },
  ];

  return (
    <aside className="h-screen w-64 shrink-0 overflow-y-auto bg-slate-900 text-white">
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold">AGS ONE</h1>
        <p className="text-sm text-slate-400">ERP Management</p>
      </div>

      <nav className="p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;

          const active = menu.exact
            ? location.pathname === menu.path
            : isPathActive(menu.path);

          const hasActiveChild =
            menu.children?.some((child) => {
              if (child.children) {
                return child.children.some((grandChild) =>
                  isPathActive(grandChild.path)
                );
              }

              return isPathActive(child.path);
            }) ?? false;

          const isExpanded = Boolean(
            menu.children && (active || hasActiveChild)
          );

          return (
            <div key={menu.path}>
              <Link
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

              {menu.children && isExpanded && (
                <div className="ml-6 space-y-1">
                  {menu.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isPathActive(child.path);

                    return (
                      <div key={child.path}>
                        <Link
                          to={child.path}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                            childActive
                              ? "bg-slate-700 text-white"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {ChildIcon && <ChildIcon size={16} />}
                          <span>{child.name}</span>
                        </Link>

                        {child.children && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {child.children.map((grandChild) => {
                              const grandChildActive = isPathActive(
                                grandChild.path
                              );

                              return (
                                <Link
                                  key={grandChild.path}
                                  to={grandChild.path}
                                  className={`block rounded-lg px-3 py-2 text-xs transition ${
                                    grandChildActive
                                      ? "bg-slate-800 text-white"
                                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                  }`}
                                >
                                  {grandChild.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}