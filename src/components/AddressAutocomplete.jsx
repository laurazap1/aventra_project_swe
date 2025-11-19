import React, { useState, useEffect, useRef } from 'react';

// Simple address autocomplete using Nominatim (OpenStreetMap).
// Props:
// - value: current input value
// - onChange: called when input text changes
// - onSelect: called with selected place object { display_name, lat, lon, type, address }
export default function AddressAutocomplete({ value, onChange, onSelect, placeholder = 'Search address' }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleDoc(e) {
      try {
        if (!e || !e.target) return;
        const node = containerRef.current;
        if (node && typeof node.contains === 'function' && !node.contains(e.target)) {
          setShow(false);
        }
      } catch (err) {
        // swallow any unexpected errors from event handling to avoid breaking the app
        console.warn('AddressAutocomplete document handler error', err);
      }
    }
    document.addEventListener('click', handleDoc);
    return () => document.removeEventListener('click', handleDoc);
  }, []);

  useEffect(() => {
    try {
      if (timer.current) clearTimeout(timer.current);
      if (!query || query.length < 2) { setSuggestions([]); setLoading(false); return; }
      setLoading(true);
      timer.current = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => {
            setSuggestions(Array.isArray(data) ? data : []);
          })
          .catch((err) => {
            console.error('Autocomplete fetch error', err);
            setSuggestions([]);
          })
          .finally(() => setLoading(false));
      }, 300);
    } catch (e) {
      console.error('Autocomplete error', e);
      setSuggestions([]);
      setLoading(false);
    }
    return () => clearTimeout(timer.current);
  }, [query]);

  function handleSelect(item) {
    try {
      setQuery(item.display_name || '');
      setSuggestions([]);
      setShow(false);
      if (onSelect) {
        try {
          onSelect(item);
        } catch (err) {
          console.error('AddressAutocomplete onSelect callback error', err);
        }
      }
    } catch (err) {
      console.error('AddressAutocomplete handleSelect error', err);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          try {
            setQuery(e.target.value);
            if (onChange) {
              try { onChange(e.target.value); } catch (err) { console.error('AddressAutocomplete onChange callback error', err); }
            }
            setShow(true);
          } catch (err) {
            console.error('AddressAutocomplete input change error', err);
          }
        }}
        onFocus={() => setShow(true)}
        className="w-full p-2 border rounded"
      />
      {show && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border rounded mt-1 max-h-60 overflow-auto shadow">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSelect(s)} className="w-full text-left px-3 py-2 hover:bg-gray-100">
              <div className="text-sm font-medium">{s.display_name.split(',').slice(0,2).join(',')}</div>
              <div className="text-xs text-gray-500">{s.display_name}</div>
            </button>
          ))}
        </div>
      )}
      {show && loading && <div className="absolute right-2 top-2 text-xs text-gray-500">Searching…</div>}
    </div>
  );
}
