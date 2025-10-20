import React from "react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 px-6">
      <h2 className="text-5xl font-extrabold mb-6 text-blue-700 tracking-wide">
        Welcome to Adventra
      </h2>
      <p className="text-xl text-gray-600 mb-10 text-center max-w-2xl leading-relaxed">
        Plan, explore, and share your journeys with other travelers. Discover hidden gems,
        create custom itineraries, and connect with the world — all in one place.
      </p>
      <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition-all duration-300 shadow-md">
        Start Planning
      </button>
    </div>
  );
}
