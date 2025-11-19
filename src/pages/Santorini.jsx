import React from "react";

export default function Santorini() {
  const handleAddToWishlist = async () => {
    const email = localStorage.getItem("userEmail");

    const response = await fetch("/api/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "Santorini", email }),
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">Santorini, Greece</h1>

      <img
        src="/images/greece.png"
        alt="Santorini"
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
          <li>Watch the sunset in Oia</li>
          <li>Relax on the black sand beaches</li>
          <li>Visit ancient Akrotiri</li>
          <li>Take a boat tour of the caldera</li>
        </ul>
      </section>

      {/* YouTube Recommendations */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          📹 YouTube Travel Guides
        </h2>
        <div className="space-y-6">
          <iframe
            title="YouTube guide - Santorini"
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/3m3kQ-7ZtAk"
            allowFullScreen
          ></iframe>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/i96vHCzV2hI"
              allowFullScreen
              title="Santorini Travel Guide 1"
            ></iframe>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/5PCgYUJVYAI"
              allowFullScreen
              title="Santorini Travel Guide 2"
            ></iframe>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/125nMc_Nz8s"
              allowFullScreen
              title="Santorini Travel Guide 3"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4 my-12">
        <div className="flex-1 border-t-2 border-gray-300"></div>
        <span className="text-3xl">✨</span>
        <div className="flex-1 border-t-2 border-gray-300"></div>
      </div>

      {/* TikTok Embed */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          TikTok Recommendations 🎵
        </h2>
        <p className="text-center text-gray-700 mb-8 text-lg">See Santorini in motion! ✨</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TikTok Card 1 */}
          <a 
            href="https://www.tiktok.com/t/ZP8U18Qum/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/greece.png"
              alt="Santorini TikTok 1"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
            </div>
          </a>

          {/* TikTok Card 2 */}
          <a 
            href="https://www.tiktok.com/t/ZP8U11Ttw/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/greece1.jpg"
              alt="Santorini TikTok 2"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
            </div>
          </a>

          {/* TikTok Card 3 */}
          <a 
            href="https://www.tiktok.com/t/ZP8U1d9f9/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/greece2.jpg"
              alt="Santorini TikTok 3"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
