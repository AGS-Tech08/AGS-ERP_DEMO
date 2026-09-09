import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingCart,
  Users,
  UserCog,
  UserRound,
  Truck,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";

interface DashboardStats {
  customers: number;
  products: number;
  vendors: number;
  purchases: number;
  sales: number;
  employees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departments: number;
}

interface ReportRow {
  [key: string]: unknown;
}

interface ApiResponse {
  data?: unknown;
}

const emptyStats: DashboardStats = {
  customers: 0,
  products: 0,
  vendors: 0,
  purchases: 0,
  sales: 0,
  employees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  departments: 0,
};

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function extractRows(response: ApiResponse): ReportRow[] {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload as ReportRow[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: ReportRow[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: ReportRow[] }).items;
  }

  return [];
}

function getValue(row: ReportRow, keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return numberValue(row[key]);
    }
  }

  return 0;
}

function getLabel(row: ReportRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  return "Unknown";
}

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);

  const [salesRows, setSalesRows] = useState<ReportRow[]>([]);
  const [employeeRows, setEmployeeRows] = useState<ReportRow[]>([]);
  const [taskRows, setTaskRows] = useState<ReportRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<ReportRow[]>([]);
  const [stockRows, setStockRows] = useState<ReportRow[]>([]);
  const [outstandingRows, setOutstandingRows] = useState<ReportRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = authHeaders();

      if (!localStorage.getItem("token")) {
        setError("Session expired. Please login again.");
        return;
      }

      const results = await Promise.allSettled([
        api.get("/dashboard", { headers }),
        api.get("/employees", {
          params: { per_page: 100 },
          headers,
        }),
        api.get("/departments", {
          params: { per_page: 100 },
          headers,
        }),
        api.get("/reports/sales-summary", { headers }),
        api.get("/reports/employees", { headers }),
        api.get("/reports/tasks", { headers }),
        api.get("/reports/attendance", { headers }),
        api.get("/reports/stock-summary", { headers }),
        api.get("/reports/outstanding", { headers }),
      ]);

      const dashboardResult = results[0];

      if (dashboardResult.status === "fulfilled") {
        const data = dashboardResult.value.data?.data;

        if (data && typeof data === "object") {
          const dashboardData = data as Record<string, unknown>;

          setStats((current) => ({
            ...current,
            customers: numberValue(dashboardData.customers),
            products: numberValue(dashboardData.products),
            vendors: numberValue(dashboardData.vendors),
            purchases: numberValue(dashboardData.purchases),
            sales: numberValue(dashboardData.sales),
          }));
        }
      }

      const employeeResult = results[1];

      if (employeeResult.status === "fulfilled") {
        const employeePage = employeeResult.value.data?.data;
        const employeeRowsForStats = Array.isArray(employeePage?.data)
          ? employeePage.data
          : [];

        setStats((current) => ({
          ...current,
          employees: numberValue(
            employeePage?.total ?? employeeRowsForStats.length,
          ),
          activeEmployees: employeeRowsForStats.filter(
            (employee: { employee_status?: string }) =>
              String(employee.employee_status ?? "").toLowerCase() ===
              "active",
          ).length,
          inactiveEmployees: employeeRowsForStats.filter(
            (employee: { employee_status?: string }) =>
              String(employee.employee_status ?? "").toLowerCase() !==
              "active",
          ).length,
        }));
      }

      const departmentResult = results[2];

      if (departmentResult.status === "fulfilled") {
        const departmentPage = departmentResult.value.data?.data;

        setStats((current) => ({
          ...current,
          departments: numberValue(
            departmentPage?.total ??
              departmentPage?.data?.length ??
              0,
          ),
        }));
      }

      if (results[3].status === "fulfilled") {
        setSalesRows(extractRows(results[3].value));
      }

      if (results[4].status === "fulfilled") {
        setEmployeeRows(extractRows(results[4].value));
      }

      if (results[5].status === "fulfilled") {
        setTaskRows(extractRows(results[5].value));
      }

      if (results[6].status === "fulfilled") {
        setAttendanceRows(extractRows(results[6].value));
      }

      if (results[7].status === "fulfilled") {
        setStockRows(extractRows(results[7].value));
      }

      if (results[8].status === "fulfilled") {
        setOutstandingRows(extractRows(results[8].value));
      }

      const failedRequests = results.filter(
        (result) => result.status === "rejected",
      );

      if (failedRequests.length === results.length) {
        setError("Unable to load dashboard data.");
      }
    } catch (requestError) {
      console.error("Dashboard Load Error:", requestError);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const salesChartData = useMemo(() => {
    const map = new Map<string, number>();

    salesRows.forEach((row) => {
      const label = getLabel(row, [
        "month",
        "month_name",
        "period",
        "sale_month",
        "date",
      ]);

      const amount = getValue(row, [
        "total_sales",
        "sales",
        "grand_total",
        "total_amount",
        "amount",
      ]);

      map.set(label, (map.get(label) ?? 0) + amount);
    });

    return Array.from(map.entries())
      .slice(-12)
      .map(([month, sales]) => ({
        month,
        sales,
      }));
  }, [salesRows]);

  const employeeChartData = useMemo(() => {
    return employeeRows.slice(0, 8).map((row) => ({
      name: getLabel(row, [
        "employee_name",
        "name",
        "employee",
        "full_name",
      ]),
      value: getValue(row, [
        "completed_tasks",
        "tasks_completed",
        "total_tasks",
        "productivity",
        "performance",
      ]),
    }));
  }, [employeeRows]);

  const taskChartData = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let inProgress = 0;

    taskRows.forEach((row) => {
      const status = getLabel(row, [
        "status",
        "task_status",
      ]).toLowerCase();

      const count = getValue(row, [
        "count",
        "total",
        "tasks",
        "task_count",
      ]);

      if (status.includes("complete")) {
        completed += count || 1;
      } else if (status.includes("progress")) {
        inProgress += count || 1;
      } else {
        pending += count || 1;
      }
    });

    return [
      {
        name: "Completed",
        value: completed,
      },
      {
        name: "In Progress",
        value: inProgress,
      },
      {
        name: "Pending",
        value: pending,
      },
    ];
  }, [taskRows]);

  const totalSales = useMemo(() => {
    return salesRows.reduce(
      (total, row) =>
        total +
        getValue(row, [
          "total_sales",
          "sales",
          "grand_total",
          "total_amount",
          "amount",
        ]),
      0,
    );
  }, [salesRows]);

  const outstandingAmount = useMemo(() => {
    return outstandingRows.reduce(
      (total, row) =>
        total +
        getValue(row, [
          "balance_amount",
          "outstanding",
          "outstanding_amount",
          "balance",
          "amount",
        ]),
      0,
    );
  }, [outstandingRows]);

  const lowStockCount = useMemo(() => {
    return stockRows.filter((row) => {
      const stock = getValue(row, [
        "current_stock",
        "stock",
        "quantity",
        "available_stock",
      ]);

      const minimum = getValue(row, [
        "minimum_stock",
        "min_stock",
        "reorder_level",
      ]);

      return minimum > 0 ? stock <= minimum : stock <= 0;
    }).length;
  }, [stockRows]);

  const attendanceCount = useMemo(() => {
    return attendanceRows.reduce(
      (total, row) =>
        total +
        getValue(row, [
          "present",
          "present_count",
          "attendance",
          "count",
        ]),
      0,
    );
  }, [attendanceRows]);

  const cards = [
    {
      title: "Customers",
      value: stats.customers,
      icon: Users,
      description: "Customer profiles",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Products",
      value: stats.products,
      icon: Package,
      description: "Products in inventory",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Vendors",
      value: stats.vendors,
      icon: Truck,
      description: "Active vendors",
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "Sales",
      value: stats.sales,
      icon: Receipt,
      description: "Total sales invoices",
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Employees",
      value: stats.employees,
      icon: UserCog,
      description: `${stats.activeEmployees} active · ${stats.inactiveEmployees} inactive`,
      bg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Departments",
      value: stats.departments,
      icon: Boxes,
      description: "Configured departments",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const quickActions = [
    {
      title: "New Sale",
      path: "/sales/create",
      icon: Receipt,
    },
    {
      title: "Customers",
      path: "/customers",
      icon: Users,
    },
    {
      title: "Products",
      path: "/products",
      icon: Package,
    },
    {
      title: "Employees",
      path: "/employees",
      icon: UserCog,
    },
    {
      title: "Reports",
      path: "/reports",
      icon: FileBarChart,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* QUICK ACTIONS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500">
              Frequently used ERP modules
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <a
                key={action.path}
                href={action.path}
                className="rounded-xl border border-slate-200 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
                  <Icon size={22} />
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {action.title}
                </p>
              </a>
            );
          })}
        </div>
      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? "—" : formatNumber(card.value)}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.iconColor}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <IndianRupee size={16} />
            Sales Value
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatCurrency(totalSales)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            From sales reports
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ShoppingCart size={16} />
            Outstanding
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatCurrency(outstandingAmount)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Customer receivables
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Package size={16} />
            Low Stock
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatNumber(lowStockCount)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Items requiring attention
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CheckCircle2 size={16} />
            Attendance
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatNumber(attendanceCount)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Attendance report data
          </p>
        </div>

      </div>

      {/* SALES ANALYTICS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={19} className="text-blue-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Sales Analytics
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Monthly sales performance
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Sales
          </span>
        </div>

        <div className="h-[320px]">
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Sales",
                  ]}
                />

                <Bar
                  dataKey="sales"
                  radius={[8, 8, 0, 0]}
                  fill="#2563eb"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
              No sales report data available.
            </div>
          )}
        </div>
      </div>

      {/* EMPLOYEE + TASK */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* EMPLOYEE PERFORMANCE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <UserRound size={19} className="text-violet-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Employee Performance
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Employee productivity overview
            </p>
          </div>

          <div className="h-[300px]">
            {employeeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employeeChartData}
                  layout="vertical"
                  margin={{
                    left: 10,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    fill="#7c3aed"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                No employee report data available.
              </div>
            )}
          </div>
        </div>

        {/* TASK OVERVIEW */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <ClipboardList size={19} className="text-emerald-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Task Overview
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Employee task status
            </p>
          </div>

          <div className="flex h-[300px] items-center justify-center">
            {taskChartData.some(
              (item) => item.value > 0,
            ) ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={taskChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          index === 0
                            ? "#10b981"
                            : index === 1
                              ? "#f59e0b"
                              : "#94a3b8"
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-900 text-2xl font-bold"
                  >
                    {taskChartData.reduce(
                      (total, item) => total + item.value,
                      0,
                    )}
                  </text>

                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-400 text-xs"
                  >
                    Total Tasks
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-400">
                No task report data available.
              </div>
            )}
          </div>

          <div className="flex justify-center gap-5 text-xs">
            {taskChartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#10b981"
                        : index === 1
                          ? "#f59e0b"
                          : "#94a3b8",
                  }}
                />

                {item.name}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SYSTEM STATUS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity size={19} className="text-blue-600" />

          <h2 className="text-lg font-bold text-slate-900">
            System Overview
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                API Connection
              </p>

              <p className="text-xs text-emerald-600">
                Connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bell size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Notifications
              </p>

              <p className="text-xs text-slate-500">
                Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <BarChart3 size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Reports
              </p>

              <p className="text-xs text-slate-500">
                Available
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}