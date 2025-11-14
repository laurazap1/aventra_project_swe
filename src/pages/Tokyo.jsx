import React from "react";

export default function Tokyo() {
  const handleAddToWishlist = async () => {
    const email = localStorage.getItem("userEmail"); // saved at login

    const response = await fetch("/api/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "Tokyo", email }),
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">Tokyo, Japan</h1>

      <img
        src="/images/tokyo.jpg"
        alt="Tokyo"
        className="rounded-xl shadow-lg w-full mb-8"
      />

      {/* Want to go Button */}
      <button
        onClick={handleAddToWishlist}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-10"
      >
        ❤️ Want to go
      </button>

      {/* Things To Do */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Top Things to Do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Visit Shibuya Crossing</li>
          <li>Explore Senso-ji Temple</li>
          <li>Walk around Akihabara Electric Town</li>
          <li>Eat sushi at Tsukiji Outer Market</li>
          <li>Relax at Ueno Park</li>
        </ul>
      </section>

      {/* YouTube Recommendations */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">YouTube Travel Guides</h2>
        <div className="space-y-6">
          <iframe
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/d-0r4VQKcK4"
            allowFullScreen
          ></iframe>

          <iframe
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/4N8UQYdM6x4"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* TikTok Embed */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">TikTok Recommendations</h2>
        <blockquote
          className="tiktok-embed"
          cite="https://www.tiktok.com/@visitjapan/video/7169452788"
        ></blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
      </section>
    </div>
  );
}