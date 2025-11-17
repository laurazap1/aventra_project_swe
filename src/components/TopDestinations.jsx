import React from "react";
import { Link } from "react-router-dom";

const destinations = [
  {
    city: "New York City",
    country: "United States",
    image: "/images/nyc.webp",
    link: "/nyc",
  },
  {
    city: "Paris",
    country: "France",
    image: "/images/paris.png",
    link: "/paris",
  },
  {
    city: "Tokyo",
    country: "Japan",
    image: "/images/tokyo.jpg",
    link: "/tokyo",
  },
  {
    city: "Santorini",
    country: "Greece",
    image: "/images/greece.png",
    link: "/santorini",
  },
];

export default function TopDestinations() {
  return (
    <section className="max-w-7xl mx-auto text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-10">
        Top Destinations
      </h2>
      <p className="text-gray-600 mb-14 text-lg max-w-2xl mx-auto">
        Explore some of the world’s most breathtaking places — hand-picked to
        inspire your next adventure.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {destinations.map((dest, idx) => (
          <Link
            to={dest.link || "#"}
            key={idx}
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
          >
            {/* Image */}
            <img
              src={dest.image}
              alt={dest.city}
              className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>

            {/* Text */}
            <div className="absolute bottom-6 left-0 right-0 px-4 text-white transform translate-y-10 group-hover:translate-y-0 transition-all duration-500">
              <h3 className="text-2xl font-semibold">{dest.city}</h3>
              <p className="text-sm text-gray-200">{dest.country}</p>
            </div>

            {/* Subtle glow outline */}
            <div className="absolute inset-0 ring-0 group-hover:ring-4 ring-blue-400/50 rounded-2xl transition-all duration-500"></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
