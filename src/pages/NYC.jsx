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

      {/* YouTube Recommendations */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          📹 YouTube Travel Guides
        </h2>
        <div className="space-y-6">
          <iframe
            title="YouTube guide - New York City"
            className="w-full h-64 rounded-lg shadow"
            src="https://www.youtube.com/embed/1k3J8Gh2QyY"
            allowFullScreen
          ></iframe>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/WHlqm72HsJc"
              allowFullScreen
              title="NYC Travel Guide 1"
            ></iframe>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/zGwNeQSI2NY"
              allowFullScreen
              title="NYC Travel Guide 2"
            ></iframe>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-64 rounded-2xl"
              src="https://www.youtube.com/embed/OVFFRPDl50Q"
              allowFullScreen
              title="NYC Travel Guide 3"
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
        <p className="text-center text-gray-700 mb-8 text-lg">See NYC in motion! ✨</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TikTok Card 1 */}
          <a 
            href="https://www.tiktok.com/t/ZP8Do7ELT/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/nyc4.jpeg"
              alt="NYC TikTok 1"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
            </div>
          </a>

          {/* TikTok Card 2 */}
          <a 
            href="https://www.tiktok.com/t/ZP8DonHcS/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/nyc2.jpeg"
              alt="NYC TikTok 2"
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">🎵 Watch on TikTok</span>
            </div>
          </a>

          {/* TikTok Card 3 */}
          <a 
            href="https://www.tiktok.com/t/ZP8Dopcga/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <img 
              src="/images/nyc3.jpeg"
              alt="NYC TikTok 3"
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
