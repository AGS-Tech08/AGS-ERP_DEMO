function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-[400px] rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-blue-700">
          AGS ERP
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Sign in to continue
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border p-3"
          />

          <button className="w-full rounded-lg bg-blue-600 p-3 text-white">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;