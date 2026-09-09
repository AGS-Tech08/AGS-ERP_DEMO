import {
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function Header() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="relative z-30 h-[72px] shrink-0 border-b border-slate-200 bg-white shadow-sm">

      {/* LEFT BRAND */}
      <div className="flex h-full items-center px-5">
        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-extrabold tracking-tight text-white">
            AGS
          </div>

          <div className="leading-none">
            <div className="text-base font-extrabold tracking-tight text-slate-900">
              ONE ERP
            </div>

            <div className="mt-1 text-[8px] font-semibold tracking-[0.16em] text-slate-400">
              CONNECT • MANAGE • GROW
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-2xl bg-white p-1.5">

        {/* Notification */}
        <button
          type="button"
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={19} strokeWidth={2} />

          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Admin */}
        <button
          type="button"
          title="Admin"
          className="flex h-9 items-center gap-1.5 rounded-xl px-2 text-slate-700 transition hover:bg-slate-100"
        >
          <UserCircle
            size={22}
            strokeWidth={1.8}
          />

          <span className="hidden text-sm font-semibold md:block">
            Admin
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut
            size={19}
            strokeWidth={2}
          />
        </button>

      </div>

    </header>
  );
}