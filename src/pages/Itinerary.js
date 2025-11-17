import React, { useState } from 'react';

export default function Itinerary() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function doSearch() {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error('search error', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center mt-8 px-4">
      <h2 className="text-2xl font-bold mb-2">Your Itinerary</h2>
      <p className="text-gray-600 mb-4">Search for events (demo using Eventbrite proxy)</p>

      <div className="flex justify-center gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded w-64"
          placeholder="e.g. concerts, kayaking"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 rounded"
          onClick={doSearch}
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && results && (
        <ul className="max-w-2xl mx-auto text-left">
          {results.length === 0 && <li className="text-gray-500">No results</li>}
          {results.map((r) => (
            <li key={r.id} className="mb-3 border-b pb-2">
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-gray-600">{r.start_time || ''} • {r.venue_name || r.venue_address || ''}</div>
              {r.url && (
                <div className="text-sm mt-1">
                  <a className="text-blue-600" href={r.url} target="_blank" rel="noreferrer">View on source</a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
