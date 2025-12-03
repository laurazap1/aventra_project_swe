import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ThingsToDo from '../components/ThingsToDo';
import PlaceSearch from '../components/PlaceSearch';

const STORAGE_PREFIX = 'aventra_itineraries_';

function loadItinerariesForUser(userKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userKey);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveItinerariesForUser(userKey, items) {
  localStorage.setItem(STORAGE_PREFIX + userKey, JSON.stringify(items || []));
}

export default function ThingsToDoPage() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (user && user.email) {
      const data = loadItinerariesForUser(user.email) || [];
      setItineraries(data);
      setSelectedIndex(0);
    }
  }, [user]);

  function persistAndSet(items) {
    if (!user || !user.email) return;
    setItineraries(items);
    saveItinerariesForUser(user.email, items);
  }

  function handleToggleDone(todo) {
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) return;
    items[idx] = { ...items[idx] };
    items[idx].todos = items[idx].todos ? items[idx].todos.map((t) => (t === todo ? { ...t, done: !t.done } : t)) : [];
    persistAndSet(items);
  }

  function handleRemove(todo) {
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) return;
    items[idx] = { ...items[idx] };
    items[idx].todos = items[idx].todos ? items[idx].todos.filter((t) => t !== todo) : [];
    persistAndSet(items);
  }

  async function addPlaceToItinerary(place) {
    if (!user || !user.email) return;
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;

    // if no itinerary exists, create a default one
    if (!items[idx]) {
      items[idx] = { title: 'My Itinerary', locations: [], todos: [] };
    }

    const newLoc = {
      id: `loc-${Date.now()}`,
      name: place.title || place.name || 'Place',
      desc: place.kinds || '',
      lat: place.lat || place.point?.lat || null,
      lng: place.lon || place.point?.lon || null,
      done: false,
      notes: ''
    };

    items[idx] = { ...items[idx] };
    items[idx].locations = items[idx].locations ? [...items[idx].locations, newLoc] : [newLoc];
    const todoItem = { title: newLoc.name, xid: place.xid || null, kinds: place.kinds || null, lat: newLoc.lat, lon: newLoc.lng, done: false };
    items[idx].todos = items[idx].todos ? [...items[idx].todos, todoItem] : [todoItem];

    persistAndSet(items);
    setSelectedIndex(idx);
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-2">Things To Do</h2>
        <p className="text-gray-700">Please log in to view and manage saved items.</p>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-2xl font-semibold">Plan your next adventure</h2>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-sm font-medium">Suggestions:</span>
              {['museum','hiking','food','beach','shopping','park'].map((s) => (
                <button key={s} className="text-xs px-3 py-1 rounded-full border text-gray-700 hover:bg-gray-50" onClick={() => {
                  const evt = new CustomEvent('aventra:setActivity', { detail: s });
                  window.dispatchEvent(evt);
                }}>{s}</button>
              ))}
            </div>

            <div className="mb-4">
              <PlaceSearch onAddPlace={addPlaceToItinerary} />
            </div>
          </div>

          <aside className="md:col-span-1">
            <div className="mb-3">
              <label className="text-sm font-medium block mb-1">Add to itinerary</label>
              <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} className="w-full border p-2 rounded">
                {itineraries.map((it, i) => (
                  <option key={i} value={i}>{it.title || `Itinerary ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-500">You have <strong>{itineraries.length}</strong> itineraries</div>
          </aside>
        </div>

        <div className="mt-6">
          <ThingsToDo todos={(itineraries[selectedIndex] && itineraries[selectedIndex].todos) || []} onToggleDone={handleToggleDone} onRemove={handleRemove} />
        </div>
      </div>
    </div>
  );
}
