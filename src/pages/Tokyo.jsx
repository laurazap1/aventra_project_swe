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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-blue-50">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Header with cute styling */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🗾</div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent mb-2">
            Tokyo, Japan
          </h1>
          <p className="text-gray-600 text-lg">✨ Experience the magic of Tokyo ✨</p>
        </div>

        <img
          src="/images/tokyo.jpg"
          alt="Tokyo"
          className="rounded-2xl shadow-2xl w-full mb-8 hover:shadow-3xl transition-shadow duration-300"
        />

        {/* Want to go Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleAddToWishlist}
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
          >
            ❤️ WANT TO GO
          </button>
        </div>

        {/* Things To Do */}
        <section className="mb-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            🎎 Top Things to Do
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-700">
              <span className="text-2xl">🌉</span>
              <span className="text-lg">Visit Shibuya Crossing</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <span className="text-2xl">⛩️</span>
              <span className="text-lg">Explore Senso-ji Temple</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <span className="text-2xl">🎮</span>
              <span className="text-lg">Walk around Akihabara Electric Town</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <span className="text-2xl">🍣</span>
              <span className="text-lg">Eat sushi at Tsukiji Outer Market</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <span className="text-2xl">🌸</span>
              <span className="text-lg">Relax at Ueno Park</span>
            </li>
          </ul>
        </section>

        {/* Best Time to Visit */}
        <section className="mb-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
            📅 Best Time to Visit
          </h3>
          <p className="text-gray-700 text-lg">
            Spring (March-May) for cherry blossoms 🌸 or Fall (September-November) for perfect weather! 
          </p>
        </section>

        {/* YouTube Recommendations */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            📹 YouTube Travel Guides
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <iframe
                className="w-full h-64 rounded-2xl"
                src="https://www.youtube.com/embed/sWEBl9A4lNY"
                allowFullScreen
                title="Tokyo Travel Guide 1"
              ></iframe>
            </div>

      {/* YouTube Recommendations */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">YouTube Travel Guides</h2>
        <div className="space-y-6">
          <iframe
            title="YouTube guide - Tokyo #1"
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/d-0r4VQKcK4"
            allowFullScreen
          ></iframe>

          <iframe
            title="YouTube guide - Tokyo #2"
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/4N8UQYdM6x4"
            allowFullScreen
          ></iframe>
        </div>

        {/* TikTok Embed */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
            TikTok Recommendations 🎵
          </h2>
          <p className="text-center text-gray-700 mb-8 text-lg">Check out these amazing Tokyo vibes! ✨</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TikTok Card 1 */}
            <a 
              href="https://www.tiktok.com/t/ZP8DnXUhb/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <img 
                src="/images/tokyo.jpg"
                alt="Tokyo TikTok"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
              </div>
            </a>

            {/* TikTok Card 2 */}
            <a 
              href="https://www.tiktok.com/t/ZP8DnqHKy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <img 
                src="/images/tokyo_tour.jpg"
                alt="Tokyo Tour TikTok"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
              </div>
            </a>

            {/* TikTok Card 3 */}
            <a 
              href="https://www.tiktok.com/t/ZP8DW6HAu/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <img 
                src="/images/tokyo.png"
                alt="Tokyo City TikTok"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}