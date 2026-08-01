function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px]">
        <h1 className="text-3xl font-bold text-center text-blue-700">
          AGS ERP
        </h1>

        <p className="text-center text-gray-500 mt-2">
          IT Infrastructure Management System
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg p-3"
          />

          <button className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;