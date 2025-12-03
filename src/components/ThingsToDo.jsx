import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PlaceSearch from './PlaceSearch';

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

export default function ThingsToDo({ initialItineraryIndex = 0, todos: propTodos, onToggleDone, onRemove }) {
  const { user } = useAuth();
  const isListOnly = Array.isArray(propTodos);
  const [itineraries, setItineraries] = useState([]);
  const displayedCount = isListOnly ? (propTodos || []).length : (itineraries || []).length;
  const todosList = isListOnly ? (propTodos || []) : ((itineraries[selectedIndex] && itineraries[selectedIndex].todos) || []);
  const [selectedIndex, setSelectedIndex] = useState(initialItineraryIndex || 0);
  const [editingNote, setEditingNote] = useState(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [cityFilter, setCityFilter] = useState(null); // {lat, lon, display_name}

  useEffect(() => {
    if (isListOnly) return; // parent manages data in list-only mode
    if (user && user.email) {
      const data = loadItinerariesForUser(user.email) || [];
      setItineraries(data);
      setSelectedIndex(Math.min(initialItineraryIndex || 0, Math.max(0, data.length - 1)));
    }
  }, [user, isListOnly, initialItineraryIndex]);

  function persist(items) {
    if (isListOnly) return; // parent persists in list-only mode
    if (!user || !user.email) return;
    setItineraries(items);
    saveItinerariesForUser(user.email, items);
  }

  function addPlace(place) {
    if (isListOnly) return; // parent handles adding in list-only mode
    if (!user || !user.email) return;
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) items[idx] = { title: 'My Itinerary', locations: [], todos: [] };

    const newLoc = {
      id: `loc-${Date.now()}`,
      name: place.title || place.name || 'Place',
      desc: place.description || '',
      lat: place.lat || place.point?.lat || null,
      lng: place.lon || place.point?.lon || null,
      preview: place.preview || null,
      done: false,
      notes: ''
    };

    items[idx] = { ...items[idx] };
    items[idx].locations = items[idx].locations ? [...items[idx].locations, newLoc] : [newLoc];
    const todoItem = { title: newLoc.name, xid: place.xid || null, kinds: place.kinds || null, lat: newLoc.lat, lon: newLoc.lng, done: false, description: newLoc.desc, preview: newLoc.preview };
    items[idx].todos = items[idx].todos ? [...items[idx].todos, todoItem] : [todoItem];

    persist(items);
    setSelectedIndex(idx);
  }

  function toggleDone(todo) {
    if (isListOnly && onToggleDone) return onToggleDone(todo);
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) return;
    items[idx] = { ...items[idx] };
    items[idx].todos = items[idx].todos ? items[idx].todos.map((t) => (t === todo ? { ...t, done: !t.done } : t)) : [];
    persist(items);
  }

  function removeTodo(todo) {
    if (isListOnly && onRemove) return onRemove(todo);
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) return;
    items[idx] = { ...items[idx] };
    items[idx].todos = items[idx].todos ? items[idx].todos.filter((t) => t !== todo) : [];
    persist(items);
  }

  function startEditNote(todo) {
    setEditingNote({ todo, text: todo.notes || '' });
  }

  function saveNote() {
    if (!editingNote) return;
    const { todo, text } = editingNote;
    const items = [...itineraries];
    const idx = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0;
    if (!items[idx]) return;
    items[idx] = { ...items[idx] };
    items[idx].todos = items[idx].todos ? items[idx].todos.map((t) => (t === todo ? { ...t, notes: text } : t)) : [];
    persist(items);
    setEditingNote(null);
  }

  // --- city filter helpers (Nominatim)
  async function searchCity(q) {
    if (!q || q.length < 2) return setCityResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Aventra/1.0 (contact)' } });
      const data = await res.json();
      setCityResults(data || []);
    } catch (e) {
      console.warn('City search failed', e);
      setCityResults([]);
    }
  }

  function selectCityFilter(c) {
    setCityFilter({ display_name: c.display_name, lat: Number(c.lat), lon: Number(c.lon) });
    setCityResults([]);
    setCityQuery(c.display_name);
  }

  function clearCityFilter() {
    setCityFilter(null);
    setCityQuery('');
    setCityResults([]);
  }

  // distance in meters between two lat/lon points (haversine)
  function distanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  if (!user) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <div className="text-center text-gray-700">Log in to manage Things To Do</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Things To Do</h3>
        <div className="text-sm text-gray-500">Items: {displayedCount}</div>
      </div>
      {!isListOnly && (
        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">Filter by city</label>
            <div className="flex gap-2">
              <input className="border p-2 rounded flex-1" placeholder="Enter a city to filter" value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setTimeout(() => searchCity(e.target.value), 300); }} />
              <button className="px-3 py-2 border rounded" onClick={() => searchCity(cityQuery)}>Search</button>
              <button className="px-3 py-2 border rounded" onClick={clearCityFilter}>Clear</button>
            </div>
            {cityResults.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto border rounded p-2 bg-white">
                {cityResults.map((c) => (
                  <li key={c.place_id} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => selectCityFilter(c)}>{c.display_name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Search activities (OpenTripMap)</label>
            <PlaceSearch onAddPlace={addPlace} center={cityFilter} />
          </div>

        </div>
      )}

      {!isListOnly && (
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm mr-2">Select itinerary:</label>
          <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} className="border p-2 rounded">
            {itineraries.map((it, i) => (
              <option key={i} value={i}>{it.title || `Itinerary ${i + 1}`}</option>
            ))}
          </select>
          <button
            title="Delete itinerary"
            aria-label="Delete itinerary"
            className="px-3 py-2 border rounded text-red-600 hover:bg-red-50"
            onClick={() => {
              // delete currently selected itinerary with confirmation
              const idx = selectedIndex >= 0 && selectedIndex < (itineraries || []).length ? selectedIndex : -1;
              if (idx === -1) return;
              const name = itineraries[idx] && itineraries[idx].title ? itineraries[idx].title : `Itinerary ${idx + 1}`;
              // eslint-disable-next-line no-restricted-globals
              if (!window.confirm(`Delete itinerary "${name}"? This cannot be undone.`)) return;
              const items = [...(itineraries || [])];
              items.splice(idx, 1);
              persist(items);
              const newIndex = items.length === 0 ? 0 : Math.max(0, Math.min(items.length - 1, idx === 0 ? 0 : idx - 1));
              setSelectedIndex(newIndex);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="inline-block">
              <path d="M3 6h18v2H3V6zm2 3h14l-1 12H6L5 9zm3-6h6v2H8V3z" />
            </svg>
          </button>
        </div>
      )}

      <div>
        {(!itineraries[selectedIndex] || !(itineraries[selectedIndex].todos || []).length) && (
          <div className="text-sm text-gray-500">No saved things yet — add from search above.</div>
        )}

        <ul className="space-y-2">
          {todosList.filter((t) => {
            if (!cityFilter) return true;
            const lat = (t.lat !== undefined && t.lat !== null) ? Number(t.lat) : (t.lat === 0 ? 0 : null);
            const lon = (t.lon !== undefined && t.lon !== null) ? Number(t.lon) : (t.lon === 0 ? 0 : null);
            if (lat === null || lon === null) return false;
            const d = distanceMeters(lat, lon, cityFilter.lat, cityFilter.lon);
            return d <= 50000; // 50km
          }).map((t, idx) => (
            <li key={t.xid || `${t.lat}-${t.lon}-${idx}`} className="p-3 border rounded flex items-start gap-3 bg-white">
              <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                {t.preview ? (
                  <img src={t.preview} alt={t.title} className="object-cover w-full h-full" />
                ) : (
                  <div className="text-xs text-gray-400">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${t.done ? 'line-through text-gray-500' : ''}`}>{t.title}</div>
                    {t.description && <div className="text-xs text-gray-600 mt-1">{t.description}</div>}
                    {t.notes && <div className="text-xs text-gray-700 mt-2">Notes: {t.notes}</div>}
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1">
                    <div className="text-xs inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{(t.kinds || '').split(',')[0]}</div>
                    <div className="text-xs text-gray-500">{t.lat && t.lon ? `${Number(t.lat).toFixed(2)}, ${Number(t.lon).toFixed(2)}` : ''}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="form-checkbox h-4 w-4" checked={!!t.done} onChange={() => toggleDone(t)} />
                    <span className="text-sm">Done</span>
                  </label>
                  <button className="text-sm text-blue-600" onClick={() => startEditNote(t)}>Edit note</button>
                  <a className="text-sm text-gray-600 border px-3 py-1 rounded" target="_blank" rel="noreferrer" href={t.xid ? `https://opentripmap.com/en/poi/${t.xid}` : `https://www.openstreetmap.org/#map=18/${t.lat}/${t.lon}`}>Open</a>
                  <button className="text-sm text-red-600" onClick={() => removeTodo(t)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editingNote && (
        <div className="mt-3 p-3 border rounded bg-gray-50">
          <h4 className="font-medium mb-2">Edit note</h4>
          <textarea className="w-full p-2 border rounded" rows={4} value={editingNote.text} onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })} />
          <div className="mt-2 flex gap-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={saveNote}>Save</button>
            <button className="border px-3 py-1 rounded" onClick={() => setEditingNote(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
