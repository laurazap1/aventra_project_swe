import React from "react";

export default function Paris() {
  const handleAddToWishlist = async () => {
    const email = localStorage.getItem("userEmail");

    const response = await fetch("/api/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "Paris", email }),
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">Paris, France</h1>

      <img
        src="/images/paris.png"
        alt="Paris"
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
          <li>Visit the Eiffel Tower</li>
          <li>Stroll through Montmartre</li>
          <li>Explore the Louvre Museum</li>
          <li>Walk along the Seine</li>
          <li>Enjoy pastries at local boulangeries</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">YouTube Travel Guides</h2>
        <div className="space-y-6">
          <iframe
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/2XhJw8d2k6k"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </div>
  );
}
