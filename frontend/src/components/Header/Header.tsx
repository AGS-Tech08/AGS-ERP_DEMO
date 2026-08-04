function Header() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-700">
          AGS ERP
        </h1>
      </div>

      <div className="flex items-center gap-4">

        <span className="text-gray-600">
          Welcome, Karthik 👋
        </span>

        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>

      </div>

    </header>
  );
}

export default Header;