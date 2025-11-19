import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Simple post detail with comments/replies/likes stored in localStorage when backend isn't used
function loadStoredReviews() {
  try {
    const raw = localStorage.getItem('aventra_reviews');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveStoredReviews(arr) {
  localStorage.setItem('aventra_reviews', JSON.stringify(arr || []));
}

function loadComments(postId) {
  try { return JSON.parse(localStorage.getItem(`aventra_comments_${postId}`)) || []; } catch (e) { return []; }
}

function saveComments(postId, comments) {
  localStorage.setItem(`aventra_comments_${postId}`, JSON.stringify(comments || []));
}

function loadLikes(postId) {
  try { return JSON.parse(localStorage.getItem(`aventra_likes_${postId}`)) || []; } catch (e) { return []; }
}

function saveLikes(postId, likes) {
  localStorage.setItem(`aventra_likes_${postId}`, JSON.stringify(likes || []));
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // helper to display first name
  const getFirstName = (nameOrEmail) => {
    if (!nameOrEmail) return 'Guest';
    if (typeof nameOrEmail === 'object') return nameOrEmail.firstName || nameOrEmail.name || nameOrEmail.username || nameOrEmail.email || 'Guest';
    const s = String(nameOrEmail);
    if (s.includes('@')) {
      const before = s.split('@')[0];
      const parts = before.split(/[^a-zA-Z]+/).filter(Boolean);
      if (parts.length > 0) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return before;
    }
    if (s.includes(' ')) return s.split(' ')[0];
    return s;
  };

  // helper to check ownership of the post
  // (ownership helpers defined later with numeric `user_id` support)

  useEffect(() => {
    const all = loadStoredReviews();
    const p = all.find(r => String(r.id) === String(id));
    if (p) setPost(p);
    setComments(loadComments(id));
    setLikes(loadLikes(id));
  }, [id]);

  // helper to check ownership of the post
  const isOwnerPost = () => {
    if (!user || !post) return false;
    if (post.user_id != null && user.id != null) {
      try { return Number(post.user_id) === Number(user.id); } catch (e) { }
    }
    const variants = [user.email, user.username, user.firstName, user.name].filter(Boolean).map(String);
    return variants.includes(String(post.username));
  };

  const isCommentOwner = (c) => {
    if (!user || !c) return false;
    if (c.user_id != null && user.id != null) {
      try { return Number(c.user_id) === Number(user.id); } catch (e) { }
    }
    const variants = [user.email, user.username, user.firstName, user.name].filter(Boolean).map(String);
    return variants.includes(String(c.author));
  };

  function requireLogin() {
    if (!user) {
      // quick prompt then send to login
      if (window.confirm('You must be logged in to do that. Go to login?')) {
        navigate('/login');
      }
      return false;
    }
    return true;
  }

  // Edit post (simple prompt-based editor)
  function editPost() {
    if (!requireLogin()) return;
    const newText = window.prompt('Edit post text', post.review_text || '');
    if (newText === null) return;
    const newRating = window.prompt('Edit rating (1-5)', post.rating || '');
    const newDest = window.prompt('Edit destination name', post.destination_name || '');
    const updated = { ...post, review_text: newText, rating: newRating, destination_name: newDest };
    setPost(updated);
    // update stored reviews
    const all = loadStoredReviews().map(r => String(r.id) === String(post.id) ? updated : r);
    saveStoredReviews(all);
    try { fetch(`/api/posts/${post.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); } catch (e) { console.warn('Server edit failed', e); }
  }

  function deletePost() {
    if (!requireLogin()) return;
    if (!window.confirm('Delete this post?')) return;
    const all = loadStoredReviews().filter(r => String(r.id) !== String(post.id));
    saveStoredReviews(all);
    try { fetch(`/api/posts/${post.id}`, { method: 'DELETE' }); } catch (e) { console.warn('Server delete failed', e); }
    navigate(-1);
  }

  function submitComment() {
    if (!requireLogin()) return;
    const c = {
      id: Date.now(),
      author: user.firstName || user.username || user.email || 'You',
      user_id: user.id ?? null,
      text,
      authorId: user.id ?? user.email ?? null,
      parentId: replyTo || null,
      createdAt: new Date().toISOString()
    };
    const next = [...comments, c];
    setComments(next);
    saveComments(id, next);
    setText('');
    setReplyTo(null);
  }

  function toggleLike() {
    if (!requireLogin()) return;
    const userId = user.email || user.id || 'anon';
    const has = likes.includes(userId);
    const next = has ? likes.filter(x => x !== userId) : [...likes, userId];
    setLikes(next);
    saveLikes(id, next);
  }

  function renderReplies(parentId) {
    return comments.filter(c => String(c.parentId) === String(parentId)).map(r => (
      <div key={r.id} className="ml-6 mt-2">
        <div className="text-xs text-gray-600">{getFirstName(r.author)} · {new Date(r.createdAt).toLocaleString()}</div>
        <div className="bg-gray-50 p-2 rounded mt-1">{r.text}</div>
        <div className="text-xs mt-1 flex gap-2">
          <button className="text-blue-600" onClick={() => { if (!requireLogin()) return; setReplyTo(r.id); setText(`@${r.author} `); }}>Reply</button>
          {isCommentOwner(r) && (
            <>
              <button className="text-sm border px-2 rounded" onClick={() => { if (!requireLogin()) return; const newText = window.prompt('Edit comment', r.text); if (newText != null) { const next = comments.map(c => c.id === r.id ? { ...c, text: newText } : c); setComments(next); saveComments(id, next); } }}>Edit</button>
              <button className="text-sm text-red-600 border px-2 rounded" onClick={() => { if (!requireLogin()) return; if (!window.confirm('Delete this reply?')) return; const next = comments.filter(c => c.id !== r.id); setComments(next); saveComments(id, next); }}>Delete</button>
            </>
          )}
        </div>
        {renderReplies(r.id)}
      </div>
    ));
  }

  if (!post) return <div className="p-6">Post not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button className="text-sm text-blue-600 mb-4" onClick={() => navigate(-1)}>← Back</button>
        <div className="bg-white rounded shadow p-4 mb-4 relative">
        <div>
          <h2 className="text-xl font-semibold">{post.destination_name}</h2>
          <div className="text-xs text-gray-600">by {getFirstName(post.username)}</div>
        </div>
        {(post.image || post.image_link) && (
          <div className="mt-3 mb-3">
            <img src={post.image || post.image_link} alt={post.destination_name} className="w-full h-56 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; console.warn('Failed to load post image for', post.id); }} />
          </div>
        )}
        <div className="mt-3 relative pb-6">{/* relative container for info + actions */}
          <div>⭐ {post.rating}/5</div>
          <p className="mt-2">{post.review_text}</p>

          {/* actions placed at info area's bottom-right: delete then edit (only if owner) */}
          {isOwnerPost() && (
            <div className="absolute bottom-0 right-0 flex items-center gap-2">
              <button onClick={editPost} title="Edit" className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded">
                {/* pencil icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                </svg>
              </button>
              <button onClick={deletePost} title="Delete" className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 rounded">
                {/* X (close) icon for delete */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Comments</h3>
          <div>
            <button
              onClick={toggleLike}
              className="inline-flex items-center gap-2 text-sm focus:outline-none"
              aria-pressed={likes.includes(user?.email || user?.id || 'anon')}
              title={likes.includes(user?.email || user?.id || 'anon') ? 'Unlike' : 'Like'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={`transition ${likes.includes(user?.email || user?.id || 'anon') ? 'text-red-500' : 'text-gray-400'}`}>
                <path d="M12 21s-6.716-4.35-9.24-7.02C-.02 11.2 1.1 6.7 4.6 5.17 7.16 3.98 9.57 5 12 7.01c2.43-2.01 4.84-3.03 7.4-1.84 3.5 1.53 4.62 6.03 1.84 8.81C18.716 16.65 12 21 12 21z" />
              </svg>
              <span className="text-sm text-gray-600">{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3">
          {comments.filter(c => !c.parentId).map(c => (
            <div key={c.id} className="mb-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">{getFirstName(c.author)} · {new Date(c.createdAt).toLocaleString()}</div>
                <div className="flex gap-2">
                  {isCommentOwner(c) && (
                    <>
                      <button className="text-sm border px-2 rounded" onClick={() => { if (!requireLogin()) return; const newText = window.prompt('Edit comment', c.text); if (newText != null) { const next = comments.map(x => x.id === c.id ? { ...x, text: newText } : x); setComments(next); saveComments(id, next); } }}>Edit</button>
                      <button className="text-sm text-red-600 border px-2 rounded" onClick={() => { if (!requireLogin()) return; if (!window.confirm('Delete this comment?')) return; const next = comments.filter(x => x.id !== c.id); setComments(next); saveComments(id, next); }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-1 bg-gray-50 p-2 rounded">{c.text}</div>
              <div className="text-xs mt-1"><button className="text-blue-600" onClick={() => { if (!requireLogin()) return; setReplyTo(c.id); setText(`@${c.author} `); }}>Reply</button></div>
              {renderReplies(c.id)}
            </div>
          ))}
          {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet. Be the first!</div>}
        </div>

        <div className="mt-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'} className="w-full border p-2 rounded mb-2" />
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={submitComment}>Post</button>
            <button className="border px-3 py-2 rounded" onClick={() => { setText(''); setReplyTo(null); }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
