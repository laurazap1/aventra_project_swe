import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ItineraryMap from '../components/ItineraryMap';
import ItineraryShare from '../components/ItineraryShare';
import AddressAutocomplete from '../components/AddressAutocomplete';
import ErrorBoundary from '../components/ErrorBoundary';
import RewardsPanel from '../components/RewardsPanel';

const STORAGE_PREFIX = 'aventra_itineraries_';
const META_SUFFIX = '_meta';

// Points settings
const POINTS_PER_LOCATION = 10; // base points per completed stop
const DIVERSITY_BONUS_PER_UNIQUE = 5; // bonus per unique region/country

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

function loadMetaForUser(userKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userKey + META_SUFFIX);
    if (!raw) return { points: 0, history: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { points: 0, history: [] };
  }
}

function saveMetaForUser(userKey, meta) {
  localStorage.setItem(STORAGE_PREFIX + userKey + META_SUFFIX, JSON.stringify(meta || { points: 0, history: [] }));
}

function calculateDiversityScore(itinerary) {
  // naive heuristic: take last segment after comma (often country/region) and count unique
  try {
    const parts = (itinerary.locations || []).map(l => (l.name || '').split(',').map(p => p.trim()).filter(Boolean));
    const lastSegs = parts.map(p => p.length > 0 ? p[p.length - 1] : '').filter(Boolean);
    const uniq = [...new Set(lastSegs)];
    return { uniqueCount: uniq.length, bonus: uniq.length * DIVERSITY_BONUS_PER_UNIQUE };
  } catch (e) {
    return { uniqueCount: 0, bonus: 0 };
  }
}

function calculatePointsForItinerary(itinerary) {
  const locCount = (itinerary.locations || []).filter(l => l.done).length;
  const base = locCount * POINTS_PER_LOCATION;
  const diversity = calculateDiversityScore(itinerary);
  return base + diversity.bonus;
}

function calculateStreak(history = []) {
  // history is array of { completedAt }
  if (!history || history.length === 0) return 0;
  // Sort descending by date
  const dates = history.map(h => new Date(h.completedAt)).sort((a, b) => b - a);
  let streak = 0;
  // normalize to date only
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  let cursor = dates[0];
  // start from most recent and count back consecutive days
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    if (i === 0) {
      // accept if completed today or yesterday as starting point
      // we'll require consecutive days following the latest
      streak = 1;
      cursor = d;
    } else {
      const expected = new Date(cursor);
      expected.setDate(expected.getDate() - 1);
      if (sameDay(d, expected)) {
        streak += 1;
        cursor = d;
      } else {
        break;
      }
    }
  }
  return streak;
}

function awardBadges(meta) {
  const badges = new Set(meta.badges || []);
  // first completion
  if ((meta.history || []).length >= 1) badges.add('first-completion');
  // diversity explorer if any history entry points >= diversity threshold (e.g., uniqueCount >= 2)
  for (const h of (meta.history || [])) {
    if (h.uniqueCount && h.uniqueCount >= 2) badges.add('diversity-explorer');
  }
  if ((meta.points || 0) >= 100) badges.add('100-points');
  if ((meta.points || 0) >= 500) badges.add('500-points');
  if ((meta.streak || 0) >= 7) badges.add('streak-7');
  meta.badges = Array.from(badges);
  return meta;
}


export default function Itinerary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [meta, setMeta] = useState({ points: 0, history: [] });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', locations: [] });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiDestination, setAiDestination] = useState('');
  const [aiDays, setAiDays] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedGenerated, setSelectedGenerated] = useState(new Set());

  useEffect(() => {
    if (user && user.email) {
      const items = loadItinerariesForUser(user.email) || [];
      setItineraries(items);
      if (items.length > 0) setSelectedItinerary(items[0]);
      const m = loadMetaForUser(user.email) || { points: 0, history: [], badges: [], streak: 0 };
      // compute streak and ensure badges
      m.streak = calculateStreak(m.history || []);
      setMeta(awardBadges(m));
    }
  }, [user]);

  function startCreate() {
    setForm({ title: '', notes: '', locations: [] });
    setCreating(true);
  }

  function addLocation() {
    setForm((s) => ({ ...s, locations: [...s.locations, { name: '', desc: '', lat: '', lng: '' }] }));
  }

  function setFormPlannedDate(value) {
    setForm(s => ({ ...s, plannedDate: value }));
  }

  function updateLocation(index, key, value) {
    setForm((s) => {
      const copy = { ...s, locations: s.locations.map((l, i) => (i === index ? { ...l, [key]: value } : l)) };
      return copy;
    });
  }

  function updateLocationFromPlace(index, place) {
    // place: Nominatim result
    const name = place.display_name || '';
    const desc = place.type || '';
    const lat = place.lat || '';
    const lng = place.lon || '';
    setForm((s) => {
      const copy = { ...s, locations: s.locations.map((l, i) => (i === index ? { ...l, name, desc, lat, lng } : l)) };
      return copy;
    });
  }

  function removeLocation(index) {
    setForm((s) => {
      const copy = { ...s, locations: s.locations.filter((_, i) => i !== index) };
      return copy;
    });
  }

  function saveItinerary() {
    if (!user || !user.email) return;
    // normalize locations to include done flag
    const normalized = { ...form, locations: (form.locations || []).map(l => ({ ...l, done: !!l.done })) };
    const items = [...itineraries, normalized];
    setItineraries(items);
    saveItinerariesForUser(user.email, items);
    setSelectedItinerary(normalized);
    setCreating(false);
  }

  function saveItinerariesAndMeta(updatedItems, updatedMeta) {
    if (!user || !user.email) return;
    setItineraries(updatedItems);
    saveItinerariesForUser(user.email, updatedItems);
    if (updatedMeta) {
      // recalc streak and badges
      updatedMeta.streak = calculateStreak(updatedMeta.history || []);
      const enriched = awardBadges({ ...updatedMeta });
      setMeta(enriched);
      saveMetaForUser(user.email, enriched);
    }
  }

  function removeItinerary(index) {
    if (!user || !user.email) return;
    const items = [...itineraries];
    if (index < 0 || index >= items.length) return;
    const name = items[index] && items[index].title ? items[index].title : `Itinerary ${index + 1}`;
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm(`Delete itinerary "${name}"? This cannot be undone.`)) return;
    const [removed] = items.splice(index, 1);
    setItineraries(items);
    saveItinerariesForUser(user.email, items);
    // adjust selectedItinerary if necessary
    if (selectedItinerary && removed && (selectedItinerary === removed || selectedItinerary.title === removed.title)) {
      if (items.length === 0) setSelectedItinerary(null);
      else setSelectedItinerary(items[Math.max(0, index - 1)]);
    }
  }

  // Simple client-side AI generator fallback:
  // If no backend AI endpoint is available, produce a lightweight itinerary skeleton
  // based on destination and number of days. This is intentionally local and deterministic
  // so it works without network/API keys.
  async function generateAIItinerary({ destination, days = 3 }) {
    if (!user || !user.email) return;
    setAiError(null);
    setAiLoading(true);
    try {
      let lat = null;
      let lon = null;
      if (destination) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`;
          const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'Aventra/1.0 (contact)' } });
          const nomJson = await nomRes.json().catch(() => []);
          if (nomJson && nomJson.length > 0) {
            lat = Number(nomJson[0].lat);
            lon = Number(nomJson[0].lon);
          }
        } catch (e) {
          console.warn('Nominatim lookup failed', e);
        }
      }

      let pois = [];
      if (lat !== null && lon !== null) {
        try {
          const radius = 10000; // meters
          const query = `
[out:json][timeout:25];
(
  node(around:${radius},${lat},${lon})[tourism~"attraction|museum|viewpoint|artwork"];
  node(around:${radius},${lat},${lon})[historic];
  node(around:${radius},${lat},${lon})[amenity~"restaurant|cafe|bar"];
  way(around:${radius},${lat},${lon})[tourism~"attraction|museum"];
  relation(around:${radius},${lat},${lon})[tourism~"attraction|museum"];
);
out center 50;
`;
          const overRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain' } });
          const overJson = await overRes.json().catch(() => null);
          if (overJson && Array.isArray(overJson.elements)) {
            pois = overJson.elements.map((e) => {
              const tags = e.tags || {};
              const name = tags['name:en'] || tags.name || tags.tourism || tags.amenity || tags.historic || 'Place';
              const latc = e.lat || (e.center && e.center.lat) || null;
              const lonc = e.lon || (e.center && e.center.lon) || null;
              return { name, desc: (tags && (tags.description || tags.note)) || '', lat: latc, lng: lonc, wikidata: tags.wikidata || null };
            }).filter(p => p.lat !== null && p.lng !== null);
          }
        } catch (e) {
          console.warn('Overpass query failed', e);
        }
      }

      // If no POIs found, fallback to simple template generator
      if (!pois || pois.length === 0) {
        // simple deterministic generator
        const title = destination ? `Trip to ${destination}` : `Quick itinerary (${new Date().toLocaleDateString()})`;
        const locations = [];
        const perDay = Math.max(1, Math.min(5, Math.round((days * 3) / Math.max(1, days))));
        const templates = [
          `Visit the iconic landmarks of ${destination || 'the destination'}`,
          `Local market and street food in ${destination || 'the destination'}`,
          `Relaxing park or viewpoint in ${destination || 'the destination'}`,
          `Museum or cultural site in ${destination || 'the destination'}`,
          `Evening entertainment district in ${destination || 'the destination'}`
        ];
        for (let d = 1; d <= days; d++) {
          for (let i = 0; i < perDay; i++) {
            const idx = ((d - 1) * perDay + i) % templates.length;
            locations.push({ name: `${templates[idx]} — Day ${d}`, desc: `Suggested stop ${i + 1} on day ${d}`, lat: null, lng: null, done: false });
          }
        }
        const newIt = { title, notes: `AI-generated ${days}-day itinerary for ${destination || 'your trip'}`, locations };
        // return for review instead of persisting automatically
        return newIt;
      }

      // Distribute POIs across days
      const maxItems = Math.min(pois.length, days * 6); // cap to avoid huge lists
      const chosen = pois.slice(0, maxItems);

      // Attempt to translate names to English using Wikidata labels when available
      const wdIds = [...new Set(chosen.map(p => p.wikidata).filter(Boolean))];
      const wdLabels = {};
      if (wdIds.length > 0) {
        try {
          // batch request (limit ids per request to 50)
          const batch = wdIds.slice(0, 50).join('|');
          const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(batch)}&props=labels&languages=en&format=json&origin=*`;
          const r = await fetch(wdUrl);
          const j = await r.json().catch(() => null);
          if (j && j.entities) {
            for (const [k, v] of Object.entries(j.entities)) {
              if (v && v.labels && v.labels.en && v.labels.en.value) wdLabels[k] = v.labels.en.value;
            }
          }
        } catch (e) {
          console.warn('Wikidata lookup failed', e);
        }
      }

      // apply translations where possible
      for (const p of chosen) {
        if ((!p.name || p.name === 'Place') && p.wikidata && wdLabels[p.wikidata]) {
          p.name = wdLabels[p.wikidata];
        } else if (p.wikidata && wdLabels[p.wikidata]) {
          // prefer English label but keep original as fallback
          p.name = wdLabels[p.wikidata] || p.name;
        }
      }
      const perDay = Math.ceil(chosen.length / days);
      const locations = [];
      for (let d = 0; d < days; d++) {
        for (let i = 0; i < perDay; i++) {
          const idx = d * perDay + i;
          if (idx >= chosen.length) break;
          const p = chosen[idx];
          locations.push({ name: p.name || `Stop ${idx + 1}`, desc: p.desc || '', lat: p.lat, lng: p.lng, done: false });
        }
      }
      const title = destination ? `Trip to ${destination}` : `Generated itinerary (${new Date().toLocaleDateString()})`;
      const newIt = { title, notes: `Generated ${days}-day itinerary around ${destination || 'the chosen area'}`, locations };
      // return generated itinerary for review (do not persist automatically)
      return newIt;
    } catch (e) {
      console.error('AI generator failed', e);
      setAiError('Failed to generate itinerary.');
    } finally {
      setAiLoading(false);
    }
  }

  // Persist a generated itinerary after user review
  function persistGeneratedItinerary(it) {
    if (!user || !user.email || !it) return;
    const items = [...itineraries, it];
    saveItinerariesForUser(user.email, items);
    setItineraries(items);
    setSelectedItinerary(it);
    setGeneratedItinerary(null);
    setSelectedGenerated(new Set());
    setReviewModalOpen(false);
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-2">Your Itineraries</h2>
        <p className="text-gray-700 mb-4">Please log in or sign up to create and share itineraries with guests.</p>
        <div className="flex justify-center gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => navigate('/login')}>Log in</button>
          <button className="border px-4 py-2 rounded" onClick={() => navigate('/register')}>Sign up</button>
        </div>
      </div>


    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto mt-8 px-4">
      <RewardsPanel meta={meta} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">My Itineraries</h2>
        </div>
        <div className="flex gap-2">
            <button className="bg-white border px-3 py-2 rounded" onClick={startCreate}>Create manually</button>
            <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => setAiModalOpen(true)}>AI help generator</button>
        </div>
      </div>

      {aiModalOpen && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">AI Itinerary Generator (free)</h3>
          <p className="text-sm text-gray-600 mb-3">Generate a suggested itinerary using public data (Nominatim + Overpass). Review results before adding.</p>
          <div className="mb-3 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-8">
              <label className="text-sm block mb-1">Destination (optional)</label>
              <input className="w-full p-2 border rounded" value={aiDestination} onChange={(e) => setAiDestination(e.target.value)} placeholder="e.g. Tokyo" />
            </div>
            <div className="col-span-2">
              <label className="text-sm block mb-1">Days</label>
              <input type="number" min={1} max={14} className="w-full p-2 border rounded" value={aiDays} onChange={(e) => setAiDays(Number(e.target.value))} />
            </div>
            <div className="col-span-2 flex flex-col items-stretch justify-end gap-2">
              <button className="w-full border px-3 py-2 rounded" onClick={() => {
                // cancel and reset AI inputs
                setAiModalOpen(false);
                setAiDestination('');
                setAiDays(3);
                setAiError(null);
              }} disabled={aiLoading}>Cancel</button>
              <button className="w-full bg-blue-600 text-white px-3 py-2 rounded shadow" onClick={async () => {
                setAiLoading(true);
                setAiError(null);
                try {
                  const gen = await generateAIItinerary({ destination: aiDestination.trim(), days: aiDays });
                  if (gen) {
                    // default to selecting all generated locations
                    setGeneratedItinerary(gen);
                    const all = new Set();
                    (gen.locations || []).forEach((_, i) => all.add(i));
                    setSelectedGenerated(all);
                    // close inline panel visually and open review modal
                    setAiModalOpen(false);
                    setReviewModalOpen(true);
                  } else {
                    setAiError('No itinerary generated.');
                  }
                } catch (e) {
                  console.error(e);
                  setAiError('Failed to generate itinerary.');
                } finally {
                  setAiLoading(false);
                }
              }} disabled={aiLoading}>{aiLoading ? 'Generating…' : 'Generate'}</button>
            </div>
          </div>
          {aiError && <div className="text-sm text-red-600 mb-2">{aiError}</div>}
          <div className="text-sm text-gray-500">Tip: leave destination blank to generate a generic trip template.</div>
        </div>
      )}

      {/* Inline review panel for generated itinerary */}
      {reviewModalOpen && generatedItinerary && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">Review generated itinerary</h3>
          <p className="text-sm text-gray-600 mb-3">Review the suggested stops below. Uncheck any you don't want to include, then add to your itineraries.</p>
          <div className="mb-3">
            <div className="font-medium mb-2">{generatedItinerary.title}</div>
            <div className="text-xs text-gray-600 mb-3">{generatedItinerary.notes}</div>
            <ul>
              {(generatedItinerary.locations || []).map((loc, i) => (
                <li key={i} className="flex items-start gap-3 mb-2">
                  <input type="checkbox" checked={selectedGenerated.has(i)} onChange={() => {
                    const copy = new Set(selectedGenerated);
                    if (copy.has(i)) copy.delete(i); else copy.add(i);
                    setSelectedGenerated(copy);
                  }} />
                  <div>
                    <div className="font-medium">{loc.name || 'Untitled'}</div>
                    <div className="text-xs text-gray-600">{loc.desc}{loc.lat && loc.lng ? ` — ${loc.lat.toFixed ? loc.lat.toFixed(6) : loc.lat}, ${loc.lng.toFixed ? loc.lng.toFixed(6) : loc.lng}` : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="border px-3 py-2 rounded" onClick={() => { setReviewModalOpen(false); setGeneratedItinerary(null); setSelectedGenerated(new Set()); }}>Close</button>
            <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => {
              // build itinerary from selected indices
              const sel = [...(selectedGenerated || [])].sort((a,b)=>a-b);
              if (!sel || sel.length === 0) {
                // nothing selected
                // just close and do nothing
                setReviewModalOpen(false);
                setGeneratedItinerary(null);
                setSelectedGenerated(new Set());
                return;
              }
              const newIt = { title: generatedItinerary.title || `Generated itinerary`, notes: generatedItinerary.notes || '', locations: sel.map(i => generatedItinerary.locations[i]).map(l => ({ ...l, done: false })) };
              persistGeneratedItinerary(newIt);
            }}>Add to my itineraries</button>
          </div>
        </div>
      )}

      {creating && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h3 className="font-semibold mb-2">New itinerary</h3>
          <input className="w-full mb-2 p-2 border rounded" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full mb-2 p-2 border rounded" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="mb-2">
            <label className="text-sm">Planned date (optional)</label>
            <input type="date" className="w-full p-2 border rounded" value={form.plannedDate || ''} onChange={(e) => setFormPlannedDate(e.target.value)} />
          </div>
          <div className="mb-2">
            <h4 className="font-medium mb-1">Locations</h4>
            {form.locations.map((loc, i) => (
              <div key={i} className="mb-2 grid grid-cols-12 gap-2 items-start">
                <div className="col-span-7">
                  <AddressAutocomplete
                    value={loc.name}
                    onChange={(v) => updateLocation(i, 'name', v)}
                    onSelect={(place) => updateLocationFromPlace(i, place)}
                    placeholder="Start typing address or place"
                  />
                </div>
                <div className="col-span-4">
                  <input className="w-full p-2 border rounded" placeholder="Short desc" value={loc.desc} onChange={(e) => updateLocation(i, 'desc', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <button type="button" onClick={() => removeLocation(i)} className="text-red-600">✕</button>
                </div>
              </div>
            ))}
            <div>
              <button className="text-sm text-blue-600 underline" onClick={addLocation}>+ Add location</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={saveItinerary}>Save</button>
            <button className="border px-3 py-2 rounded" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <div className="bg-white rounded shadow p-4 mb-4">
            <h4 className="font-semibold mb-2">Your itineraries</h4>
            {itineraries.length === 0 && <div className="text-sm text-gray-600">No itineraries yet. Create one above.</div>}
            <ul>
              {itineraries.map((it, idx) => {
                const plannedDate = it.plannedDate ? new Date(it.plannedDate) : null;
                const isPastPlanned = plannedDate && !it.completed && (new Date() > plannedDate);
                return (
                <li key={idx} className="mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.title || `Itinerary ${idx + 1}`}</div>
                      <div className="text-xs text-gray-500">{(it.locations || []).length} stops</div>
                      {it.completed && <div className="text-xs text-green-600">Completed {it.completedAt ? new Date(it.completedAt).toLocaleDateString() : ''}</div>}
                      {!it.completed && isPastPlanned && <div className="text-xs text-red-600">Past planned date</div>}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600" onClick={() => setSelectedItinerary(it)}>View</button>
                      <button title="Delete itinerary" aria-label="Delete itinerary" className="text-sm text-red-600" onClick={() => removeItinerary(idx)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="inline-block align-middle">
                          <path d="M3 6h18v2H3V6zm2 3h14l-1 12H6L5 9zm3-6h6v2H8V3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              )})}
            </ul>
          </div>

          {selectedItinerary && (
            <>
              <div className="mb-4"><ItineraryShare itinerary={selectedItinerary} /></div>
              <div className="bg-white rounded shadow p-3 mb-4">
                <h4 className="font-semibold mb-2">History & Performance</h4>
                <div className="text-sm">Total points: <strong>{meta.points}</strong></div>
                <div className="text-sm">Completed itineraries: <strong>{meta.history.length}</strong></div>
                <div className="mt-2">
                  <h5 className="font-medium">Recent completions</h5>
                  <ul>
                    {meta.history.slice(-5).reverse().map((h, i) => (
                      <li key={i} className="text-xs text-gray-700">{h.title} — {h.points} pts — {new Date(h.completedAt).toLocaleDateString()}</li>
                    ))}
                    {meta.history.length === 0 && <li className="text-xs text-gray-500">No completed itineraries yet.</li>}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedItinerary ? (
            <>
              <div className="bg-white rounded shadow p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedItinerary.title}</h3>
                    <p className="text-sm text-gray-600">{selectedItinerary.notes}</p>
                  </div>
                  <div className="text-right">
                      <div className="text-sm">Points: <strong>{calculatePointsForItinerary(selectedItinerary)}</strong></div>
                      {selectedItinerary.plannedDate && !selectedItinerary.completed && new Date() > new Date(selectedItinerary.plannedDate) && (
                        <div className="text-xs text-red-600">Past planned date</div>
                      )}
                    {selectedItinerary.completed && <div className="text-xs text-green-600">Completed</div>}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded shadow p-4 mb-4">
                <h4 className="font-medium mb-2">Checklist</h4>
                <ul>
                  {(selectedItinerary.locations || []).map((loc, idx) => (
                    <li key={idx} className="flex items-center gap-3 mb-2">
                      <input type="checkbox" checked={!!loc.done} onChange={() => {
                        // toggle done
                        const updated = { ...selectedItinerary, locations: selectedItinerary.locations.map((ll, i) => i === idx ? { ...ll, done: !ll.done } : ll) };
                        // if all done, mark itinerary completed and award points
                        const allDone = (updated.locations || []).every(x => x.done);
                        if (allDone && !updated.completed) {
                          updated.completed = true;
                          updated.completedAt = new Date().toISOString();
                          const pts = calculatePointsForItinerary(updated);
                          const newMeta = { ...meta, points: (meta.points || 0) + pts, history: [...(meta.history || []), { title: updated.title, points: pts, completedAt: updated.completedAt }] };
                          // persist
                          const newItems = itineraries.map(it => it === selectedItinerary ? updated : it);
                          saveItinerariesAndMeta(newItems, newMeta);
                          setSelectedItinerary(updated);
                          return;
                        }
                        // otherwise just update
                        const newItems = itineraries.map(it => it === selectedItinerary ? updated : it);
                        saveItinerariesAndMeta(newItems, null);
                        setSelectedItinerary(updated);
                      }} />
                      <div className={loc.done ? 'line-through text-gray-500' : ''}>
                        <div className="font-medium">{loc.name || 'Untitled'}</div>
                        <div className="text-xs text-gray-600">{loc.desc}</div>
                      </div>
                    </li>
                  ))}
                  {(selectedItinerary.locations || []).length === 0 && <li className="text-xs text-gray-500">No locations yet.</li>}
                </ul>
              </div>

              <ItineraryMap
                locations={(selectedItinerary.locations || []).map((l) => ({
                  name: l.name,
                  desc: l.desc,
                  lat: l.lat,
                  lng: l.lng,
                  itineraryName: selectedItinerary.title,
                }))}
                height={480}
              />
            </>
          ) : (
            <>
              <div className="bg-white rounded shadow p-4 mb-4">
                <h3 className="font-semibold">All itineraries</h3>
                <p className="text-sm text-gray-600">Showing all saved itineraries on the map</p>
              </div>
              <ItineraryMap
                locations={itineraries.flatMap((it, idx) => (it.locations || []).map((l) => ({
                  name: l.name,
                  desc: l.desc,
                  lat: l.lat,
                  lng: l.lng,
                  itineraryName: it.title || `Itinerary ${idx + 1}`,
                })))}
                height={480}
              />
            </>
          )}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
