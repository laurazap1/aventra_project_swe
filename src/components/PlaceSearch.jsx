import React, { useState, useEffect, useCallback } from 'react';

// PlaceSearch: uses Nominatim for geocoding and OpenTripMap for POI discovery.
// Requires REACT_APP_OPENTRIPMAP_KEY in environment (.env.local)
export default function PlaceSearch({ onAddPlace, center }) {
  const [activity, setActivity] = useState(''); // e.g. 'museum', 'hiking', 'food'
  const [locationQuery, setLocationQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingProxy, setUsingProxy] = useState(false);
  const [usingOverpass, setUsingOverpass] = useState(false);

  const OTM_KEY = process.env.REACT_APP_OPENTRIPMAP_KEY;

  // user-visible warning when API key is not configured
  const missingKey = !OTM_KEY || OTM_KEY.trim().length === 0;

  // Map common user-friendly activity words to OpenTripMap `kinds` taxonomy terms.
  // This reduces 'Unknown category' errors and improves result relevance.
  const ACTIVITY_TO_KINDS = {
    museum: 'museums',
    museums: 'museums',
    hiking: 'natural',
    hike: 'natural',
    food: 'restaurants',
    restaurant: 'restaurants',
    restaurants: 'restaurants',
    beach: 'beaches',
    shopping: 'shops',
    shop: 'shops',
    park: 'parks'
  };

  const hasFeatures = (d) => !!(
    (Array.isArray(d) && d.length > 0) ||
    (d && d.features && Array.isArray(d.features) && d.features.length > 0)
  );

  // Overpass fallback: query OpenStreetMap directly (no API key) when OpenTripMap is unavailable
  async function fetchOverpass(lat, lon, radius = 1000, activityKeyword) {
    try {
      const kind = activityKeyword && activityKeyword.trim().length > 0 ? activityKeyword.trim().toLowerCase() : null;
      // simple mapping from activity -> OSM tags to search for
      const activityToOsm = {
        museum: 'tourism=museum',
        museums: 'tourism=museum',
        hiking: 'tourism=information',
        food: 'amenity=restaurant|amenity=cafe|amenity=fast_food',
        beach: 'natural=beach',
        shopping: 'shop',
        park: 'leisure=park'
      };
      let filters = [];
      if (kind && activityToOsm[kind]) {
        const mapped = activityToOsm[kind];
        // allow multiple tag options separated by |
        mapped.split('|').forEach((m) => {
          const [k, v] = m.split('=');
          if (v) filters.push(`node["${k}"="${v}"](around:${radius},${lat},${lon});`);
          else filters.push(`node["${k}"](around:${radius},${lat},${lon});`);
        });
      } else {
        // generic fallbacks: shops, tourism, amenity
        filters = [
          `node["shop"](around:${radius},${lat},${lon});`,
          `node["tourism"](around:${radius},${lat},${lon});`,
          `node["amenity"](around:${radius},${lat},${lon});`
        ];
      }

      const query = `[out:json][timeout:25];(${filters.join('')});out center;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain' } });
      if (!res.ok) return [];
      const data = await res.json().catch(() => null);
      if (!data || !data.elements) return [];
      const list = data.elements.map((el) => {
        const name = el.tags && (el.tags.name || el.tags['shop'] || el.tags['amenity'] || el.tags['tourism']) || 'Place';
        // prefer an explicit image tag if present
        const preview = el.tags && (el.tags.image || el.tags['image']) ? el.tags.image || el.tags['image'] : null;
        const lon = el.lon || (el.center && el.center.lon) || null;
        const lat = el.lat || (el.center && el.center.lat) || null;
        return {
          // do NOT set xid to an opentripmap value — leave xid null so Details link falls back to OSM
          xid: null,
          osmId: el.id,
          osmLink: `https://www.openstreetmap.org/node/${el.id}`,
          name,
          kinds: Object.keys(el.tags || {}).join(', '),
          dist: null,
          lon,
          lat,
          preview
        };
      }).filter(Boolean);
      return list;
    } catch (e) {
      console.warn('Overpass fetch failed', e);
      return [];
    }
  }

  // search city with nominatim
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

  // fetch POIs from OpenTripMap using radius around coords
  // If `activity` is provided we try to pass it as the `kinds` filter.
  const fetchPOIs = useCallback(async (lat, lon) => {
    // If client-side key exists, prefer it. Otherwise try the backend proxy if available.
    if (!OTM_KEY) {
      // determine kinds to use (mapped or raw activity)
      const kindsToUse = activity && activity.trim().length > 0 ? (ACTIVITY_TO_KINDS[activity.trim().toLowerCase()] || activity.trim()) : null;
      // attempt to use server proxy
      try {
        const proxyUrl = `/api/opentripmap/radius?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=5000&limit=30${kindsToUse ? `&kinds=${encodeURIComponent(kindsToUse)}` : ''}`;
        const r = await fetch(proxyUrl);
        const data = await r.json().catch(() => null);
        // If proxy returned an error object (eg. Unknown category), try again without the kinds filter.
        if (data && data.error && activity) {
          console.warn('Proxy returned error for kinds filter, retrying without kinds:', data.error);
          const retryUrl = `/api/opentripmap/radius?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=5000&limit=30`;
          const r2 = await fetch(retryUrl);
          if (r2.ok) {
            const data2 = await r2.json().catch(() => null);
            if (hasFeatures(data2)) {
              setUsingProxy(true);
              const list2 = (data2.features || data2 || []).map((f) => mapFeatureToPoi(f)).filter(Boolean);
              setPois(list2);
              return;
            }
          }
          console.warn('Proxy retry without kinds failed, trying Overpass fallback');
          setUsingProxy(false);
          const over = await fetchOverpass(lat, lon, 5000, activity);
          if (over && over.length > 0) {
            setUsingOverpass(true);
            setPois(over);
            return;
          }
        } else if (r.ok && hasFeatures(data)) {
          // mark that we successfully used the proxy so the UI can reflect it
          setUsingProxy(true);
          const list = (data.features || data || []).map((f) => mapFeatureToPoi(f)).filter(Boolean);
          setPois(list);
          return;
        } else {
          // if proxy returned empty object ({}), try Overpass before falling back to mocks
          if (r.ok && !hasFeatures(data)) {
            console.warn('Proxy returned empty result — trying Overpass fallback');
            const over2 = await fetchOverpass(lat, lon, 5000, activity);
            if (over2 && over2.length > 0) {
              setUsingOverpass(true);
              setPois(over2);
              return;
            }
          }
          console.warn('Proxy lookup failed, falling back to mock', r && r.status);
          setUsingProxy(false);
        }
      } catch (e) {
        console.warn('Proxy request failed', e);
        setUsingProxy(false);
      }
      // proxy not available or failed — return mocks for UI testing
      console.warn('OpenTripMap API key not set in REACT_APP_OPENTRIPMAP_KEY — trying Overpass then mocked sample results for UI testing.');
      const over = await fetchOverpass(lat, lon, 5000, activity);
      if (over && over.length > 0) {
        setUsingOverpass(true);
        setPois(over);
        return;
      }
      const mock = generateMockPois(lat, lon, activity);
      setPois(mock);
      return;
    }
    setLoading(true);
    try {
      const radius = 5000; // 5km default
      const limit = 30;
      // prefer mapped kinds when calling the OpenTripMap API directly
      const kindsToUse = activity && activity.trim().length > 0 ? (ACTIVITY_TO_KINDS[activity.trim().toLowerCase()] || activity.trim()) : null;
      let url = `https://api.opentripmap.com/0.1/en/places/radius?apikey=${OTM_KEY}&radius=${radius}&limit=${limit}&offset=0&lon=${lon}&lat=${lat}`;
      if (kindsToUse) {
        url += `&kinds=${encodeURIComponent(kindsToUse)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      // If the API returned an error about the kinds/category, retry without the kinds filter.
        if (data && data.error && activity) {
        console.warn('OpenTripMap returned error for kinds filter, retrying without kinds:', data.error);
        const urlNoKinds = `https://api.opentripmap.com/0.1/en/places/radius?apikey=${OTM_KEY}&radius=${radius}&limit=${limit}&offset=0&lon=${lon}&lat=${lat}`;
        try {
          const res2 = await fetch(urlNoKinds);
          const data2 = await res2.json();
          const list2 = (data2.features || data2 || []).map((f) => mapFeatureToPoi(f)).filter(Boolean);
          setPois(list2);
          return;
        } catch (e) {
          console.warn('Retry without kinds failed', e);
            // try Overpass as a fallback
            const over2 = await fetchOverpass(lat, lon, 5000, activity);
            if (over2 && over2.length > 0) {
              setUsingOverpass(true);
              setPois(over2);
              return;
            }
        }
      }
      // debug: log response when empty to help troubleshooting
      if (!hasFeatures(data)) {
        console.debug('OpenTripMap returned no results for', { lat, lon, activity: activity, raw: data });
        // try Overpass before falling back
        const overFallback = await fetchOverpass(lat, lon, radius, activity);
        if (overFallback && overFallback.length > 0) {
          setUsingOverpass(true);
          setPois(overFallback);
          return;
        }
        // otherwise nothing
        setPois([]);
        return;
      }
      // data objects often have xid or properties; map tolerant
      const list = (data.features || data || []).map((f) => mapFeatureToPoi(f)).filter(Boolean);
      setPois(list);
    } catch (e) {
      console.warn('OTM fetch failed', e);
      setPois([]);
    } finally {
      setLoading(false);
    }
  }, [OTM_KEY, activity, ACTIVITY_TO_KINDS]);

  // generate a few mock POIs near the provided coords for dev/testing when API key is absent
  function generateMockPois(lat, lon, activityKeyword) {
    const centerLat = Number(lat) || 0;
    const centerLon = Number(lon) || 0;
    const names = [
      `${activityKeyword || 'Local'} Cafe`,
      `${activityKeyword || 'Local'} Spot`,
      `${activityKeyword || 'Local'} Experience`,
      `Popular ${activityKeyword || 'Place'}`
    ];
    return names.map((n, i) => ({
      xid: `mock-${i}-${Date.now()}`,
      name: n,
      kinds: activityKeyword || 'park',
      dist: (i + 1) * 200,
      lon: centerLon + (i - 1.5) * 0.01,
      lat: centerLat + (i - 1.5) * 0.008,
      preview: null
    }));
  }

  // helper: normalize/convert an OpenTripMap feature/record into a POI shape used by the UI
  function mapFeatureToPoi(f) {
    if (!f) return null;
    try {
      if (f.properties && f.properties.xid) {
        return {
          xid: f.properties.xid,
          name: f.properties.name || f.properties.kinds || 'POI',
          kinds: f.properties.kinds,
          dist: f.properties.dist,
          lon: f.geometry && f.geometry.coordinates ? f.geometry.coordinates[0] : null,
          lat: f.geometry && f.geometry.coordinates ? f.geometry.coordinates[1] : null,
          preview: f.properties.preview && f.properties.preview.source ? f.properties.preview.source : null
        };
      }
      return {
        xid: f.xid || f.properties?.xid || f.id,
        name: f.name || f.kinds || f.properties?.name || 'POI',
        kinds: f.kinds || f.properties?.kinds,
        lon: f.point?.lon || f.geometry?.coordinates?.[0] || null,
        lat: f.point?.lat || f.geometry?.coordinates?.[1] || null,
        preview: f.preview?.source || null
      };
    } catch (e) {
      return null;
    }
  }

  // get full details for a POI (optional, could fetch on demand)
  async function fetchPOIDetails(xid) {
    if (!xid) return null;
    // prefer client key if available, otherwise try backend proxy
    if (OTM_KEY) {
      try {
        const url = `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(xid)}?apikey=${OTM_KEY}`;
        const res = await fetch(url);
        return await res.json();
      } catch (e) {
        console.warn('POI details failed (client)', e);
        return null;
      }
    }
    // try server proxy
    try {
      const r = await fetch(`/api/opentripmap/xid/${encodeURIComponent(xid)}`);
      if (!r.ok) {
        console.warn('Proxy POI details failed', r.status, await r.text());
        return null;
      }
      const data = await r.json();
      return data;
    } catch (e) {
      console.warn('POI details failed (proxy)', e);
      return null;
    }
  }

  // handlers
  function onLocationInput(e) {
    const v = e.target.value;
    setLocationQuery(v);
    if (!v) {
      setCityResults([]);
      return;
    }
    // debounce simple
    setTimeout(() => searchCity(v), 350);
  }

  function selectCity(c) {
    setSelectedCity(c);
    setCityResults([]);
    setLocationQuery(c.display_name);
    // fetch POIs around city center
    fetchPOIs(c.lat, c.lon);
  }

  // If a center prop is provided (e.g., selected city from parent), use it as the selectedCity
  useEffect(() => {
    if (center && center.lat && center.lon) {
      const synthetic = { display_name: center.display_name || 'Selected location', lat: String(center.lat), lon: String(center.lon) };
      setSelectedCity(synthetic);
      setLocationQuery(synthetic.display_name);
      // fetch POIs around provided center
      fetchPOIs(center.lat, center.lon);
    }
  }, [center, fetchPOIs]);

  // Listen for suggested activity chip clicks from ThingsToDoPage
  useEffect(() => {
    function onSuggested(e) {
      if (e && e.detail) setActivity(e.detail);
    }
    window.addEventListener('aventra:setActivity', onSuggested);
    return () => window.removeEventListener('aventra:setActivity', onSuggested);
  }, []);

  async function handleAdd(p) {
    // fetch details to enrich item
    const details = p.xid ? await fetchPOIDetails(p.xid) : null;
    const item = {
      title: p.name || (details && details.name) || 'Untitled',
      xid: p.xid || (details && details.xid) || null,
      kinds: p.kinds || (details && details.kinds) || null,
      description: (details && (details.wikipedia_extracts?.text || details.info?.descr)) || '',
      lat: p.lat || (details && details.point && details.point.lat) || null,
      lon: p.lon || (details && details.point && details.point.lon) || null,
      preview: p.preview || (details && details.preview && details.preview.source) || null
    };
    if (onAddPlace) onAddPlace(item);
  }
  return (
    <div className="bg-gradient-to-br from-white/80 to-slate-50/60 rounded-lg p-3 mb-4 backdrop-blur-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-emerald-300 flex items-center justify-center shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" />
            <circle cx="12" cy="9" r="2.2" fill="#0b1220" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">Find things to do</h4>
          <div className="text-xs text-slate-500">Discover places and add them to your itinerary</div>
        </div>
      </div>

      {/* Removed prominent missing-key banner to reduce noise; key absence is handled in console and fallbacks. */}
      {missingKey && usingProxy && (
        <div className="mb-3 p-2 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
          Using backend OpenTripMap proxy (server key). Results come from server-side key.
        </div>
      )}
      {missingKey && usingOverpass && (
        <div className="mb-3 p-2 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
          Using OpenStreetMap Overpass (no API key required). Results come from Overpass queries.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start mb-3">
        <div className="md:col-span-1">
          <label className="text-xs text-gray-600">Activity type</label>
          <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. museum, hiking, food, shopping" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500">Try:</span>
            <div className="flex flex-wrap gap-2">
              {['museum','hiking','food','beach','shopping','park'].map((s) => (
                <button key={s} onClick={() => setActivity(s)} className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-white/60 hover:bg-blue-50 shadow-sm">{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {!center && (
            <>
              <label className="text-xs text-gray-600">Place (city or area)</label>
              <div className="flex gap-2">
                <input value={locationQuery} onChange={onLocationInput} placeholder="City or neighborhood (e.g. Paris, Montmartre)" className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                <button onClick={() => searchCity(locationQuery)} className="px-3 py-2 rounded-lg bg-white border shadow-sm hover:bg-emerald-50">Find</button>
              </div>
            </>
          )}
          {center && (
            <div className="text-sm text-gray-600">Searching around: <strong>{center.display_name || `${center.lat}, ${center.lon}`}</strong></div>
          )}
        </div>
      </div>

      {cityResults.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-gray-600 mb-1">Select location</div>
          <ul className="space-y-1 max-h-48 overflow-auto">
            {cityResults.map((c) => (
              <li key={c.place_id} className="p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => selectCity(c)}>
                <div className="font-medium">{c.display_name}</div>
                <div className="text-xs text-gray-500">lat: {c.lat}, lon: {c.lon}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(selectedCity || center) && (
        <div className="mb-2">
          <div className="text-sm text-gray-700 mb-2">Showing activities near: <strong>{(selectedCity && selectedCity.display_name) || center.display_name}</strong></div>
          {loading && <div className="text-sm text-gray-500">Loading activities…</div>}
          {!loading && pois.length === 0 && missingKey && (
            <div className="text-sm text-gray-500">Search disabled because API key is missing.</div>
          )}
          {!loading && pois.length === 0 && !missingKey && (
            <div className="text-sm text-gray-500">No activities found. Try a different activity, broaden the search area, or check the browser console for details.</div>
          )}
              <ul className="space-y-3 max-h-64 overflow-auto">
                {pois.map((p) => (
                  <li key={p.xid || `${p.lat}-${p.lon}`} className="p-3 border rounded hover:shadow-sm transition-shadow flex items-start gap-3 bg-white">
                    <div className="w-20 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {p.preview ? (
                        <img src={p.preview} alt={p.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="text-xs text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.kinds}</div>
                      </div>
                      {p.dist !== undefined && <div className="text-xs text-gray-500 mt-1">{Math.round(p.dist)} m away</div>}
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => handleAdd(p)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Add</button>
                        {(() => {
                          let detailsHref = '#';
                          if (p.osmLink) {
                            detailsHref = p.osmLink;
                          } else if (p.xid) {
                            detailsHref = `https://opentripmap.com/en/poi/${p.xid}`;
                          } else if (p.lat && p.lon) {
                            detailsHref = `https://www.openstreetmap.org/#map=18/${p.lat}/${p.lon}`;
                          }
                          return (
                            <a target="_blank" rel="noreferrer" href={detailsHref} className="text-sm text-gray-600 border px-3 py-1 rounded">Details</a>
                          );
                        })()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
        </div>
      )}
    </div>
  );
}
