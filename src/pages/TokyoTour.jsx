import React from "react";

export default function TokyoTour() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">Tokyo Tower Night Walking Tour</h1>

      <img
        src="/images/tokyo_tour.jpg"
        alt="Tokyo Tower Night Walking Tour"
        className="rounded-xl shadow-lg w-full mb-8"
      />

      {/* Description */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">About This Activity</h2>
        <p className="text-gray-700 leading-7">
          Enjoy a magical evening exploring the area around Tokyo Tower. Walk through
          Minato City with a local guide, take in panoramic views from the observation
          deck, discover photo spots, and try local snacks as the city lights up at night.
        </p>
      </section>

      {/* Highlights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Highlights</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Guided walking tour around Tokyo Tower district</li>
          <li>Nighttime views from Tokyo Tower’s observation area</li>
          <li>Stops at scenic viewpoints and hidden alleys</li>
          <li>Optional street food tasting and local recommendations</li>
        </ul>
      </section>

      {/* Details */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Tour Details</h2>
        <p className="text-gray-700">
          <strong>Location:</strong> Minato City, Tokyo<br />
          <strong>Duration:</strong> 2 hours<br />
          <strong>Price:</strong> $25 per person
        </p>
      </section>

      {/* Booking Button */}
      <section>
        <a
          href="https://www.getyourguide.com/tokyo-tower-l3547/tokyo-night-tour"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Book This Activity
        </a>
      </section>
    </div>
  );
}
