import React, { useState } from "react";

const allActivities = [
  {
    title: "Tokyo Tower Night Walking Tour",
    city: "Tokyo",
    img: "/images/tokyo_tour.jpg",
    path: "/featured/tokyo-tour",
  },
  {
    title: "Sailing Through the Norwegian Fjords",
    city: "Norway",
    img: "/images/norway.jpg",
  },
  {
    title: "Hot Air Balloon Ride in Cappadocia",
    city: "Cappadocia",
    img: "/images/capadocia.jpg",
  },
  {
    title: "Explore the Glowworm Caves",
    city: "Waitomo",
    img: "/images/waitmo.jpg",
  },
];

export default function FeaturedActivities() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? allActivities
      : allActivities.filter((a) => a.city === filter);

  const cities = ["All", ...new Set(allActivities.map((a) => a.city))];

  return (
    <section className="max-w-7xl mx-auto text-center">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-10">
        Featured Activities
      </h2>
      <p className="text-gray-600 mb-14 text-lg max-w-2xl mx-auto">
        Handpicked adventures across the world — from breathtaking mountains to hidden natural wonders.
      </p>

      {/* Filter Buttons */}
      <div className="flex justify-center mb-10 flex-wrap gap-3">
        {cities.map((city, idx) => (
          <button
            key={idx}
            onClick={() => setFilter(city)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              filter === city
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:scale-105"
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
          >
            {/* Image */}
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>

            {/* Text */}
            <div className="absolute bottom-6 left-0 right-0 px-4 text-white transform translate-y-10 group-hover:translate-y-0 transition-all duration-500">
              <h4 className="text-xl font-semibold mb-1">{item.title}</h4>
              <p className="text-sm text-gray-200">{item.city}</p>
            </div>

            {/* Glow Border */}
            <div className="absolute inset-0 ring-0 group-hover:ring-4 ring-indigo-400/40 rounded-2xl transition-all duration-500"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
