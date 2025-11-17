import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });

      if (res.status === 200) {
        // ✅ 1. Set login state first
        login(res.data.user);

        // ✅ 2. Wait for state to update before redirecting
        setTimeout(() => {
          alert(`✅ Welcome back, ${res.data.user.name}!`);
          navigate("/");
        }, 100);
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-w-4xl w-full">
        {/* Hero Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-600 flex flex-col justify-center items-center text-white p-10">
          <h2 className="text-3xl font-bold mb-3">Welcome Back 👋</h2>
          <p className="text-blue-100 text-center leading-relaxed">
            Log in to continue exploring destinations and managing your trips with Adventra.
          </p>
        </div>

        {/* Form Section */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Login to Your Account
          </h3>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-600 mb-2 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-2 text-sm">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
            >
              Login
            </button>

            <div className="text-center text-sm text-gray-500 mt-3">
              <span>Don’t have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
