import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import axios from "axios";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/api/auth/register", {
        name,
        email,
        password,
      });

      if (res.status === 201) {
        alert(`✅ ${res.data.message || "Account created successfully!"}`);
        navigate("/login");
      } else {
        alert(res.data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-w-4xl w-full">
        {/* Left Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-600 flex flex-col justify-center items-center text-white p-10">
          <h2 className="text-3xl font-bold mb-3">Welcome to Adventra 🌍</h2>
          <p className="text-blue-100 text-center leading-relaxed">
            Join our travel community and start planning your next unforgettable experience.
          </p>
        </div>

        {/* Right Section - Form */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Create Your Account
          </h3>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-gray-600 mb-2 text-sm">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-gray-600 mb-2 text-sm">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-600 mb-2 text-sm">Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
            >
              Create Account
            </button>

            <div className="text-center text-sm text-gray-500 mt-3">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
