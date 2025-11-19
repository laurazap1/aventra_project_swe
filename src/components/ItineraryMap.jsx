import React, { useEffect, useRef } from 'react';

// Lightweight Leaflet loader using CDN links so no extra install is required.
export default function ItineraryMap({ locations = [], routes = [], height = 400 }) {
  const mapRef = useRef(null);
  // create a stable, unique container id per component instance to avoid id collisions
  const idRef = useRef(`itinerary-map-${Math.random().toString(36).slice(2, 9)}`);

  // Load Leaflet CSS & JS via CDN once
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      const jsSrc = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

      // ensure CSS is added once
      if (!document.querySelector(`link[href="${cssHref}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
      }

      // if Leaflet already available, just init
      if (window.L) {
        initMap();
        return;
      }

      // Avoid inserting multiple script tags if one is already loading
      let existingScript = document.querySelector(`script[src="${jsSrc}"]`);
      if (!existingScript) {
        existingScript = document.createElement('script');
        existingScript.src = jsSrc;
        existingScript.async = true;
        existingScript.crossOrigin = 'anonymous';
        existingScript.onerror = () => {
          console.error('Failed to load Leaflet script from CDN');
          const container = document.getElementById(idRef.current);
          if (container) {
            container.innerHTML = '<div style="padding:20px;color:#7f1d1d">Map failed to load. Please check your network or try again later.</div>';
          }
        };
        document.body.appendChild(existingScript);
      }

      // ensure we initialize after load; if script already loaded (but window.L not set yet), wait until window.L
      const onLoad = () => {
        try { initMap(); } catch (e) { console.error('initMap error', e); }
      };

      if (window.L) {
        onLoad();
      } else {
        existingScript.addEventListener('load', onLoad, { once: true });
      }
    } catch (e) {
      console.error('ItineraryMap setup error', e);
    }

    return () => {
      // cleanup map instance if exists
      try {
        if (mapRef.current && mapRef.current._leaflet_id) {
          mapRef.current.remove();
        }
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, routes]);

  function initMap() {
    // if map already exists, remove and recreate to refresh markers
    const container = document.getElementById(idRef.current);
    if (!container) return;

    // remove old instance if present (for hot-reload)
    if (container._leaflet_map) {
      try { container._leaflet_map.remove(); } catch (e) {}
      container._leaflet_map = null;
    }

    const L = window.L;
    const map = L.map(container).setView([0, 0], 2);
    container._leaflet_map = map;

    const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // log tile errors for easier diagnostics
    try {
      tile.on('tileerror', (err) => {
        console.warn('Tile error', err);
      });
    } catch (e) {}

    const markers = [];
    const latlngs = [];
    locations.forEach((loc) => {
      const lat = (typeof loc.lat === 'string') ? parseFloat(loc.lat) : loc.lat;
      const lng = (typeof loc.lng === 'string') ? parseFloat(loc.lng) : loc.lng;
      if (!loc || Number.isNaN(lat) || Number.isNaN(lng)) return;
      const m = L.marker([lat, lng]).addTo(map);
      const itineraryLabel = loc.itineraryName ? `<div class="text-xs text-gray-600">${loc.itineraryName}</div>` : '';
      const popupHtml = `<div style="min-width:160px"><strong>${loc.name || ''}</strong>${itineraryLabel}<div class="text-sm">${loc.desc || ''}</div><div style="margin-top:6px"><a target='_blank' href='https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}'>Navigate</a></div></div>`;
      m.bindPopup(popupHtml);
      markers.push(m);
      latlngs.push([lat, lng]);
    });

    // diagnostic log
    try { console.debug('ItineraryMap init, markers:', markers.length, 'latlngs:', latlngs.length); } catch (e) {}

    // Draw route polyline if provided
    if (routes && routes.length > 0) {
      routes.forEach((r) => {
        const pts = r.map(p => [p.lat, p.lng]);
        if (pts.length > 1) {
          L.polyline(pts, { color: 'blue' }).addTo(map);
        }
      });
    } else if (latlngs.length > 1) {
      // connect all markers in order
      L.polyline(latlngs, { color: 'blue' }).addTo(map);
    }

    if (latlngs.length === 1) {
      map.setView(latlngs[0], 12);
    } else if (latlngs.length > 1) {
      map.fitBounds(latlngs, { padding: [40, 40] });
    }

    // In some layouts the map can render gray if size isn't calculated yet.
    // Invalidate size after next paint to ensure tiles render.
    setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 200);

    mapRef.current = map;
  }

  return (
    <div className="w-full rounded shadow border overflow-hidden">
      <div id={idRef.current} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
