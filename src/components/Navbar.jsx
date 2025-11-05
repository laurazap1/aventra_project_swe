import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // ✅ Import AuthContext

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ✅ Access global user + logout function

  const handleLogout = () => {
    logout(); // ✅ Logs out globally and updates Navbar instantly
    setShowDropdown(false);
    alert("Logged out successfully.");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <h1
          className="text-2xl font-extrabold text-blue-600 cursor-pointer tracking-tight"
          onClick={() => navigate("/")}
        >
          Adventra
        </h1>

        {/* Deskto0op Links */}
        <div className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors duration-200">
            Home
          </Link>
          <Link to="/itinerary" className="hover:text-blue-600 transition-colors duration-200">
            Itinerary
          </Link>
          <Link to="/things-to-do" className="hover:text-blue-600 transition-colors duration-200">
            Things to Do
          </Link>
          <Link to="/reviews" className="hover:text-blue-600 transition-colors duration-200">
            Reviews
          </Link>
        </div>

        {/* Profile Section */}
        <div className="flex items-center space-x-4 relative">
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-200"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline font-semibold">Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full hover:bg-blue-200 transition duration-200"
              >
                <UserCircle className="w-6 h-6 text-blue-600" />
                <span className="hidden md:inline font-medium text-gray-800">
                  {user.name || "User"}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-44 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md flex flex-col space-y-3 px-6 py-4 border-t border-gray-100">
          <Link to="/" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <Link to="/itinerary" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>
            Itinerary
          </Link>
          <Link to="/things-to-do" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>
            Things to Do
          </Link>
          <Link to="/reviews" className="hover:text-blue-600" onClick={() => setIsOpen(false)}>
            Reviews
          </Link>

          {!user ? (
            <button
              onClick={() => {
                navigate("/login");
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-gray-800"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
