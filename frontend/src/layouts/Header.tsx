import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">

      <div className="relative w-96">
        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-6">

        <Bell
          size={22}
          className="cursor-pointer text-gray-600"
        />

        <div className="flex items-center gap-2">

          <UserCircle
            size={32}
            className="text-blue-600"
          />

          <div>
            <p className="font-semibold">
              {user.name || "Administrator"}
            </p>

            <p className="text-xs text-gray-500">
              {user.email || ""}
            </p>
          </div>

        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </header>
  );
}