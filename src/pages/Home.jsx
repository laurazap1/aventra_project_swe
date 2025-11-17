import React, { useState } from "react";
import TopDestinations from "../components/TopDestinations";
import FeaturedActivities from "../components/FeaturedActivities";
import { BedDouble, Plane, Map } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Stays");
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <div
        className="relative h-[80vh] flex flex-col justify-center items-center text-center text-white overflow-hidden"
        style={{
          backgroundImage: "url('/images/swiss.avif')", // scenic hero image
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-800/40 to-blue-700/70"></div>

        <div className="relative z-10 w-full max-w-4xl px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-md animate-fadeUp">
            Find Your Perfect Adventure
          </h1>
          <p className="text-lg md:text-xl mb-10 text-blue-100 animate-fadeUp">
            From hidden gems to world-famous landmarks — discover where your next trip begins.
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-6 space-x-3 animate-fadeUp">
            {[
              { name: "Stays", icon: <BedDouble className="w-4 h-4 mr-1" /> },
              { name: "Flights", icon: <Plane className="w-4 h-4 mr-1" /> },
              { name: "Things to Do", icon: <Map className="w-4 h-4 mr-1" /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.name
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-white/90 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between p-4 md:space-x-4 space-y-3 md:space-y-0 max-w-3xl mx-auto animate-fadeUp">
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className="w-full md:w-1/3 p-3 border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:scale-[1.02] transition-all duration-300"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="search-query"
            />
            <input
              type="date"
              className="w-full md:w-1/3 p-3 border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:scale-[1.02] transition-all duration-300"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="search-date"
            />
            <input
              type="number"
              placeholder="Guests"
              min="1"
              className="w-full md:w-1/4 p-3 border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:scale-[1.02] transition-all duration-300"
              aria-label="guests"
            />
            <button
              className="relative bg-blue-600 text-white px-6 py-3 rounded-lg overflow-hidden group transition-all duration-300"
              onClick={async () => {
                // build query and call backend proxy /api/search
                setLoading(true);
                setResults([]);
                try {
                  const params = new URLSearchParams();
                  if (q) params.append('q', q);
                  if (date) {
                    // convert YYYY-MM-DD to ISO range for the day
                    params.append('start', `${date}T00:00:00Z`);
                    params.append('end', `${date}T23:59:59Z`);
                  }
                  const res = await fetch(`/api/search?${params.toString()}`);
                  const data = await res.json();
                  setResults(data.results || []);
                } catch (err) {
                  console.error('search failed', err);
                  setResults([]);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-md"></span>
              <span className="relative z-10">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Destinations Section */}
      <div className="py-20 px-6 bg-white">
        <TopDestinations />
      </div>

      {/* Search results */}
      <div className="py-6 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {loading && <div className="text-center">Loading results...</div>}
          {!loading && results && results.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Search Results</h3>
              <ul className="space-y-3">
                {results.map((r) => (
                  <li key={r.id} className="p-4 bg-white rounded shadow">
                    <div className="font-semibold text-lg">{r.title}</div>
                    <div className="text-sm text-gray-600">{r.start_time || ''} • {r.venue_name || r.venue_address || ''}</div>
                    {r.url && (
                      <div className="mt-2">
                        <a className="text-blue-600" href={r.url} target="_blank" rel="noreferrer">Open on source</a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loading && results && results.length === 0 && (
            <div className="text-center text-gray-600">No results found — try a different query or date.</div>
          )}
        </div>
      </div>

      {/* Featured Experiences Section */}
      <div className="py-20 px-6 bg-gray-50">
        <FeaturedActivities />
      </div>
    </div>
  );
}
