import React, { useState } from 'react';

function encodeShareData(obj) {
  try {
    return encodeURIComponent(btoa(JSON.stringify(obj)));
  } catch (e) {
    return '';
  }
}

export default function ItineraryShare({ itinerary }) {
  const [guestEmail, setGuestEmail] = useState('');
  const [lastLink, setLastLink] = useState('');

  function makeShareLink() {
    // simple token generator (demo) — not cryptographically secure
    const token = Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
    const payload = { id: token, data: itinerary, ts: Date.now() };
    const encoded = encodeShareData(payload);
    const url = `${window.location.origin}/shared-itinerary?payload=${encoded}`;
    setLastLink(url);
    return url;
  }

  function handleSend(e) {
    e.preventDefault();
    const url = lastLink || makeShareLink();
    // Open mailto to allow user to send link via their email client (simple demo)
    if (guestEmail) {
      const subject = encodeURIComponent('You have been invited to view an itinerary');
      const body = encodeURIComponent(`Hi,\n\nI shared an itinerary with you. View it here:\n${url}\n\n- Shared via Adventra`);
      window.location.href = `mailto:${guestEmail}?subject=${subject}&body=${body}`;
    } else {
      // copy to clipboard
      navigator.clipboard?.writeText(url).then(() => alert('Share link copied to clipboard'));
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h4 className="font-semibold mb-2">Share itinerary</h4>
      <div className="text-sm text-gray-600 mb-3">Invite a guest by email or generate a shareable link.</div>
      <form onSubmit={handleSend} className="flex gap-2 items-center">
        <input
          type="email"
          placeholder="Guest email (optional)"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" type="submit">Send</button>
      </form>

      <div className="mt-3 text-sm">
        <button
          className="underline text-blue-600"
          onClick={() => { const url = makeShareLink(); navigator.clipboard?.writeText(url); alert('Link created and copied'); }}
        >
          Create & copy link
        </button>
        {lastLink && (
          <div className="mt-2 break-all text-xs text-gray-700">{lastLink}</div>
        )}
      </div>
    </div>
  );
}
