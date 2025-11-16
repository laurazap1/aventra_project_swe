import React from "react";

export default function NYC() {
  const handleAddToWishlist = async () => {
    const email = localStorage.getItem("userEmail");

    const response = await fetch("/api/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "New York City", email }),
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">New York City, USA</h1>

      <img
        src="/images/nyc.webp"
        alt="New York City"
        className="rounded-xl shadow-lg w-full mb-8"
      />

      <button
        onClick={handleAddToWishlist}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-10"
      >
        ❤️ Want to go
      </button>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Top Things to Do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>See a Broadway show</li>
          <li>Walk the High Line</li>
          <li>Visit Central Park</li>
          <li>Explore Times Square</li>
          <li>Check out the MET</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">YouTube Travel Guides</h2>
        <div className="space-y-6">
          <iframe
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/1k3J8Gh2QyY"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </div>
  );
}
