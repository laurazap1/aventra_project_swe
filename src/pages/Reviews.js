import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import local images
import newyorkImg from '../assets/newyork.jpg';
import londonImg from '../assets/london.jpg';
import tokyoImg from '../assets/tokyo.jpg';
import parisImg from '../assets/paris.jpg';

export default function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    username: '',
    destination_name: '',
    rating: '',
    review_text: '',
    image: null
  });
  // showCreate replaces showForm: toggles create-post form
  const [showCreate, setShowCreate] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [, setPosting] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [, setUploading] = useState(false);
  const [, setLikesVersion] = useState(0);

  // Map destination names → images + country
  const DESTINATIONS = {
    'new york': { name: 'New York', country: 'USA', image: newyorkImg },
    'london': { name: 'London', country: 'United Kingdom', image: londonImg },
    'tokyo': { name: 'Tokyo', country: 'Japan', image: tokyoImg },
    'paris': { name: 'Paris', country: 'France', image: parisImg }
  };



  // cleanup preview object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch (err) { }
      }
    };
  }, [previewUrl]);

  const demoReviews = () => {
    return [
      { username: 'Alice', rating: 5, review_text: 'Amazing!', destination_name: 'New York' },
      { username: 'Bob', rating: 4, review_text: 'Great time!', destination_name: 'London' },
      { username: 'Charlie', rating: 3, review_text: 'Okay.', destination_name: 'Tokyo' },
      { username: 'Diana', rating: 5, review_text: 'Loved it!', destination_name: 'Paris' }
    ];
  };

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/reviews/101');
      const data = await response.json();

      // attach ids if missing
      const payload = (data.length > 0 ? data : demoReviews()).map((r) => ({ id: r.id || Date.now() + Math.random(), ...r }));

      // preserve any local-only reviews (optimistic or offline) by merging
      const local = JSON.parse(localStorage.getItem('aventra_reviews') || '[]');
      const merged = [
        ...local,
        ...payload.filter(p => !local.find(l => String(l.id) === String(p.id)))
      ];
      setReviews(merged);
      localStorage.setItem('aventra_reviews', JSON.stringify(merged));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // On error, use local stored reviews if present, otherwise demo
      const local = JSON.parse(localStorage.getItem('aventra_reviews') || 'null');
      if (local && Array.isArray(local) && local.length > 0) {
        setReviews(local);
      } else {
        const payload = demoReviews().map((r) => ({ id: Date.now() + Math.random(), ...r }));
        setReviews(payload);
        localStorage.setItem('aventra_reviews', JSON.stringify(payload));
      }
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [showMine, fetchReviews]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewReview({ ...newReview, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (window.confirm('You must log in to submit a review. Go to login?')) navigate('/login');
      return;
    }

    setPosting(true);
    const formData = new FormData();
    // prefer logged-in user identity
    formData.append("username", user?.email || newReview.username || 'Anonymous');
    formData.append("destination_name", newReview.destination_name);
    formData.append("rating", newReview.rating);
    formData.append("review_text", newReview.review_text);

    // If user selected a file, attempt upload to /api/upload first
    let image_url = newReview.image || null;
    if (file) {
      setUploading(true);
      try {
        const upForm = new FormData();
        upForm.append('file', file);
        const upRes = await fetch('/api/upload', { method: 'POST', body: upForm });
        if (upRes.ok) {
          const upJson = await upRes.json();
          image_url = upJson.url || null;
        } else {
          console.warn('Upload failed', upRes.status);
        }
      } catch (err) {
        console.warn('Upload request failed', err);
      } finally {
        setUploading(false);
      }
    }

    if (image_url && typeof image_url === 'string') {
      formData.append('image_link', image_url);
    } else if (newReview.image) {
      // append raw data URL or file if available
      if (newReview.image instanceof File) formData.append('image', newReview.image);
      else formData.append('image_link', newReview.image);
    }

    // If an image file was provided, convert to data URL so it can be shown immediately and persisted locally
    const toDataURL = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let imageData = null;
    try {
      if (file) {
        imageData = await toDataURL(file);
      } else if (newReview.image && newReview.image instanceof File) {
        imageData = await toDataURL(newReview.image);
      }
    } catch (err) {
      console.warn('Could not read image file for preview', err);
      imageData = null;
    }

    // Optimistic local update so UI is responsive
    const usernameForPost = user?.firstName || user?.name || user?.username || user?.email || newReview.username || 'Anonymous';
    const newItem = {
      id: Date.now(),
      username: usernameForPost,
      user_id: user?.id ?? null,
      destination_name: newReview.destination_name,
      rating: newReview.rating,
      review_text: newReview.review_text,
      image: imageData,
      image_link: image_url
    };
    const next = [newItem, ...reviews];
    setReviews(next);
    localStorage.setItem('aventra_reviews', JSON.stringify(next));

    // Try to POST to server but swallow network errors to avoid uncaught exceptions
    try {
      await fetch("http://127.0.0.1:5000/reviews", {
        method: "POST",
        body: formData
      });
      // refresh from server if successful
      fetchReviews();
    } catch (err) {
      console.warn('Review POST failed (server unreachable). Kept review locally.', err);
    } finally {
      setPosting(false);
    }

    setNewReview({ username: '', destination_name: '', rating: '', review_text: '', image: null });
    // cleanup preview and file
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (err) {} setPreviewUrl(null); }
    setFile(null);
  };

  // Helper to extract a friendly first name from stored username/email
  const getFirstName = (nameOrEmail) => {
    if (!nameOrEmail) return 'Guest';
    if (typeof nameOrEmail === 'object') {
      return nameOrEmail.firstName || nameOrEmail.name || nameOrEmail.username || nameOrEmail.email || 'Guest';
    }
    const s = String(nameOrEmail);
    if (s.includes('@')) {
      const before = s.split('@')[0];
      // split on non-letters
      const parts = before.split(/[^a-zA-Z]+/).filter(Boolean);
      if (parts.length > 0) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return before;
    }
    // if contains space, take first token
    if (s.includes(' ')) return s.split(' ')[0];
    return s;
  };

  // Helper to determine whether current user owns a review
  const isOwner = (review) => {
    if (!user || !review) return false;
    // prefer numeric user_id comparison if available
    if (review.user_id != null && user.id != null) {
      try {
        return Number(review.user_id) === Number(user.id);
      } catch (e) {
        // fall through to string matching
      }
    }
    const variants = [user.email, user.username, user.firstName, user.name].filter(Boolean).map(String);
    return variants.includes(String(review.username));
  };

  // Require login helper (navigates to login if user cancels)
  const requireLogin = () => {
    if (!user) {
      if (window.confirm('You must be logged in to do that. Go to login?')) navigate('/login');
      return false;
    }
    return true;
  };

  // Toggle like/unlike for a review (optimistic, stored in localStorage)
  const toggleLike = async (review, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!requireLogin()) return;
    const id = review.id;
    const userId = user.email || user.id || 'anon';
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(`aventra_likes_${id}`)) || []; } catch (err) { arr = []; }
    const has = arr.includes(userId);
    const nextArr = has ? arr.filter(x => x !== userId) : [...arr, userId];
    try { localStorage.setItem(`aventra_likes_${id}`, JSON.stringify(nextArr)); } catch (err) { console.warn('Could not save likes locally', err); }
    // bump version so UI re-renders
    setLikesVersion(v => v + 1);

    // best-effort server sync
    try {
      await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: has ? 'unlike' : 'like' })
      });
    } catch (err) {
      // ignore server errors — local state remains authoritative for now
      console.warn('Like sync failed', err);
    }
  };

  // Likes count helper: check common fields first, otherwise fallback to localStorage key `aventra_likes_<id>`
  const getLikesCount = (review) => {
    if (!review) return 0;
    // common server-side shapes
    if (Array.isArray(review.likes)) return review.likes.length;
    if (typeof review.like_count === 'number') return review.like_count;
    if (typeof review.likes_count === 'number') return review.likes_count;

    try {
      const ls = localStorage.getItem(`aventra_likes_${review.id}`);
      if (!ls) return 0;
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed)) return parsed.length;
    } catch (e) {
      // ignore parse errors
    }
    return 0;
  };

  // Delete a post locally and attempt server delete
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const next = reviews.filter(r => String(r.id) !== String(postId));
    setReviews(next);
    localStorage.setItem('aventra_reviews', JSON.stringify(next));
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    } catch (err) {
      console.warn('Server delete failed', err);
    }
  };

  // Edit a post via simple prompt and save locally and to server
  const handleEditPostSave = async (postId) => {
    const p = reviews.find(r => String(r.id) === String(postId));
    if (!p) return;
    const newText = window.prompt('Edit your review text', p.review_text || '');
    if (newText === null) return; // cancelled
    const newRating = window.prompt('Edit rating (1-5)', p.rating || '');
    const newDest = window.prompt('Edit destination name', p.destination_name || '');
    const updated = { ...p, review_text: newText, rating: newRating, destination_name: newDest };
    const next = reviews.map(r => String(r.id) === String(postId) ? updated : r);
    setReviews(next);
    localStorage.setItem('aventra_reviews', JSON.stringify(next));
    try {
      await fetch(`/api/posts/${postId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    } catch (err) {
      console.warn('Server edit failed', err);
    }
  };

  return (
    <div className="container mx-auto text-center mt-20 px-4">
      <h2 className="text-4xl font-bold mb-4">Traveler Reviews</h2>

      {/* Submit Review Section (toggle) */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Submit a Review</h3>
          <div className="flex items-center gap-3">
            {/* My reviews toggle - icon + subtle label */}
            <button
              onClick={() => setShowMine(s => !s)}
              aria-pressed={showMine}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${showMine ? 'bg-blue-600 text-white shadow' : 'bg-white text-blue-600 border'}`}
              title={showMine ? 'Showing only your reviews' : 'Show only your reviews'}
            >
              {/* user icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-90">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">{showMine ? 'Mine' : 'All'}</span>
            </button>

            {/* Primary FAB to open/close the create form */}
            <button
              onClick={() => setShowCreate(c => !c)}
              aria-expanded={showCreate}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transform transition ${showCreate ? 'bg-red-500 rotate-45' : 'bg-green-600 hover:scale-105'}`}
              title={showCreate ? 'Close form' : 'Add a review'}
            >
              {showCreate ? (
                // X icon (close)
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
                </svg>
              ) : (
                // plus icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">

          {/* Name */}
          <input
            type="text"
            name="username"
            placeholder="Your Name"
            value={newReview.username}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Destination Name (TEXT BOX) */}
          <input
            type="text"
            name="destination_name"
            placeholder="Destination Name (e.g., Paris)"
            value={newReview.destination_name}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Rating (DROPDOWN) */}
          <select
            name="rating"
            value={newReview.rating}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Rating (1–5)</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>

          {/* Review */}
          <textarea
            name="review_text"
            placeholder="Your Review"
            value={newReview.review_text}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Upload Image with preview + optional URL */}
          <div className="text-left">
            <label className="block mb-1 font-medium">Upload a Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0] || null;
                if (f) {
                  // create a temporary object URL for preview
                  const url = URL.createObjectURL(f);
                  // revoke previous preview if exists
                  if (previewUrl) {
                    try { URL.revokeObjectURL(previewUrl); } catch (err) { }
                  }
                  setPreviewUrl(url);
                  setFile(f);
                } else {
                  if (previewUrl) {
                    try { URL.revokeObjectURL(previewUrl); } catch (err) { }
                  }
                  setPreviewUrl(null);
                  setFile(null);
                }
              }}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {previewUrl && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Selected image preview</div>
                <img src={previewUrl} alt="preview" className="w-full h-40 object-cover rounded" />
                <div className="text-xs text-gray-500 mt-1">{file ? file.name : ''} {file ? `• ${(file.size/1024|0)} KB` : ''}</div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">Or paste an image URL</div>
            <input className="w-full mt-1 p-2 border rounded text-black" placeholder="Image URL (optional)" value={newReview.image || ''} onChange={(e) => setNewReview({ ...newReview, image: e.target.value })} />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Review
          </button>
        </form>
        )}
      </div>

      {/* Existing Reviews */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">Existing Reviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {reviews
            .filter(r => !showMine || (user && isOwner(r)))
            .map((review, index) => {
            const key = review.destination_name?.toLowerCase();
            const dest = DESTINATIONS[key] || {
              name: review.destination_name,
              country: "Unknown",
              image: "https://source.unsplash.com/600x400/?travel"
            };

            return (
              <Link key={review.id} to={`/reviews/${review.id}`} className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="relative">
                        <img
                          src={review.image || review.image_link || dest.image}
                          className="w-full h-48 object-cover"
                          alt={dest.name}
                          onError={(e) => { e.currentTarget.src = dest.image; console.warn('Failed to load review image for id', review.id); }}
                        />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      {getFirstName(review.username)}
                    </div>
                </div>

                <div className="px-5 py-3 text-left relative">
                  <h4 className="text-lg font-semibold">{dest.name}</h4>
                  <p className="text-gray-500 text-sm">{dest.country}</p>
                </div>

                <div className="px-5 pb-5 text-left relative">
                  <p className="text-yellow-500 font-bold mb-2">⭐ {review.rating}/5</p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-gray-700 truncate">{review.review_text}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {/* clickable heart + likes count (prevent link navigation) */}
                      <button
                        onClick={(e) => toggleLike(review, e)}
                        aria-pressed={(user && (() => {
                          try { const ls = JSON.parse(localStorage.getItem(`aventra_likes_${review.id}`) || '[]'); return ls.includes(user.email || user.id || 'anon'); } catch (e) { return false; }
                        })())}
                        className="flex items-center gap-2 focus:outline-none"
                        title="Like"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={`transition ${((() => { try { const ls = JSON.parse(localStorage.getItem(`aventra_likes_${review.id}`) || '[]'); return ls.includes(user?.email || user?.id || 'anon'); } catch (e) { return false; } })()) ? 'text-red-500' : 'text-gray-400'}`}>
                          <path d="M12 21s-6.716-4.35-9.24-7.02C-.02 11.2 1.1 6.7 4.6 5.17 7.16 3.98 9.57 5 12 7.01c2.43-2.01 4.84-3.03 7.4-1.84 3.5 1.53 4.62 6.03 1.84 8.81C18.716 16.65 12 21 12 21z" />
                        </svg>
                        <span className="font-medium">{getLikesCount(review)}</span>
                      </button>
                    </div>
                  </div>

                  {/* actions moved to info area bottom-right: delete then edit (swap order) */}
                  {showMine && isOwner(review) && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditPostSave(review.id); }}
                        title="Edit"
                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {/* pencil icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePost(review.id); }}
                        title="Delete"
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 rounded"
                      >
                        {/* X (close) icon for delete */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                          <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

        </div>
      </div>
    </div>
  )
}
