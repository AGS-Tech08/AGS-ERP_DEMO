import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8000/api/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Login Successful");

      navigate("/dashboard");
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Invalid Email or Password"
      );
    } finally {
      setLoading(false);
    }
  };

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default Login;