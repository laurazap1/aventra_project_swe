import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">Adventra</h1>

        {/* Hamburger Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-yellow-200">Home</Link>
          <Link to="/itinerary" className="hover:text-yellow-200">Itinerary</Link>
          <Link to="/reviews" className="hover:text-yellow-200">Reviews</Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-700 flex flex-col space-y-3 px-6 py-4">
          <Link to="/" className="hover:text-yellow-200" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/itinerary" className="hover:text-yellow-200" onClick={() => setIsOpen(false)}>Itinerary</Link>
          <Link to="/reviews" className="hover:text-yellow-200" onClick={() => setIsOpen(false)}>Reviews</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
