import React, { useEffect, useState } from 'react';
import ItineraryMap from '../components/ItineraryMap';

function decodePayload(encoded) {
  try {
    return JSON.parse(atob(decodeURIComponent(encoded)));
  } catch (e) {
    return null;
  }
}

export default function SharedItinerary() {
  const [it, setIt] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('payload');
    if (payload) {
      const decoded = decodePayload(payload);
      if (decoded && decoded.data) {
        setIt(decoded.data);
      }
    }
  }, []);

  if (!it) return (
    <div className="text-center mt-12">
      <h2 className="text-2xl font-semibold">No shared itinerary found</h2>
      <p className="text-gray-600 mt-2">Please check the link or ask the owner to re-share.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold mb-2">Shared itinerary</h2>
      <p className="text-gray-600 mb-4">This itinerary was shared with you — view-only access.</p>

      <div className="bg-white rounded shadow p-4 mb-4">
        <h3 className="font-semibold">{it.title || 'Untitled itinerary'}</h3>
        <p className="text-sm text-gray-600">{it.notes || ''}</p>
      </div>

      <ItineraryMap locations={it.locations || []} height={480} />

      <ul className="mt-4">
        {(it.locations || []).map((l, i) => (
          <li key={i} className="mb-2 border-b pb-2">
            <div className="font-semibold">{l.name}</div>
            <div className="text-sm text-gray-600">{l.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
