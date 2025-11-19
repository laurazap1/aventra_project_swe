import React, { useEffect, useState, useCallback } from "react";

export default function Reviews() {
  const CURRENT_USER_ID = 1; // demo current user
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    image_link: "",
  });
  const [showCreate, setShowCreate] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePostComments, setActivePostComments] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [showMine, setShowMine] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = showMine ? "?user_id=1" : "";
      const res = await fetch(`/api/posts${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [showMine]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // cleanup preview object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (err) {}
      }
    };
  }, [previewUrl]);

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newPost.title) return alert("Title is required");
    try {
      let image_url = newPost.image_link || "";
      // if a file was chosen, upload it first
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const up = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (up.status === 201) {
          const upJson = await up.json();
          image_url = upJson.url;
        } else {
          const b = await up.json();
          setUploading(false);
          return alert("Upload failed: " + (b.error || JSON.stringify(b)));
        }
        setUploading(false);
      }

      const payload = { ...newPost, image_link: image_url, user_id: 1 };
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        setNewPost({ title: "", content: "", image_link: "" });
        if (previewUrl) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch (err) {}
          setPreviewUrl(null);
        }
        setFile(null);
        setShowCreate(false);
        fetchPosts();
      } else {
        const body = await res.json();
        alert("Error: " + (body.error || JSON.stringify(body)));
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
      setUploading(false);
    }
  }

  async function handleLikePost(post_id) {
    try {
      await fetch(`/api/posts/${post_id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1 }),
      });
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleComments(post_id) {
    if (activePostComments[post_id]) {
      setActivePostComments((s) => ({ ...s, [post_id]: null }));
      return;
    }
    try {
      const res = await fetch(`/api/posts/${post_id}`);
      const data = await res.json();
      setActivePostComments((s) => ({ ...s, [post_id]: data }));
    } catch (e) {
      console.error(e);
    }
  }

  async function openPostDetail(post_id) {
    try {
      const res = await fetch(`/api/posts/${post_id}`);
      const data = await res.json();
      setSelectedPost(data);
    } catch (e) {
      console.error(e);
    }
  }

  function closePostDetail() {
    setSelectedPost(null);
  }

  async function handleDeletePost(post_id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: CURRENT_USER_ID }),
      });
      if (res.status === 200) {
        closePostDetail();
        fetchPosts();
      } else {
        const b = await res.json();
        alert("Error: " + (b.error || JSON.stringify(b)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function handleEditPostSave(postId, updated) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updated, user_id: CURRENT_USER_ID }),
      });
      if (res.status === 200) {
        const d = await fetch(`/api/posts/${postId}`);
        const j = await d.json();
        setSelectedPost(j);
        fetchPosts();
      } else {
        const b = await res.json();
        alert("Error: " + (b.error || JSON.stringify(b)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteComment(comment_id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${comment_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: CURRENT_USER_ID }),
      });
      if (res.status === 200) {
        // refresh modal
        if (selectedPost) {
          const r = await fetch(`/api/posts/${selectedPost.post.post_id}`);
          const d = await r.json();
          setSelectedPost(d);
          fetchPosts();
        }
      } else {
        const b = await res.json();
        alert("Error: " + (b.error || JSON.stringify(b)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleEditCommentSave(comment_id, updatedText) {
    try {
      const res = await fetch(`/api/comments/${comment_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID,
          comment_text: updatedText,
        }),
      });
      if (res.status === 200) {
        if (selectedPost) {
          const r = await fetch(`/api/posts/${selectedPost.post.post_id}`);
          const d = await r.json();
          setSelectedPost(d);
          fetchPosts();
        }
      } else {
        const b = await res.json();
        alert("Error: " + (b.error || JSON.stringify(b)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateComment(post_id, formState, resetFn) {
    if (!formState.comment_text) return alert("Comment is required");
    if (formState.image_link && !/^(https?:\/\/)/i.test(formState.image_link)) {
      return alert("Comment image URL must start with http:// or https://");
    }
    try {
      const res = await fetch(`/api/posts/${post_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState, user_id: 1 }),
      });
      if (res.status === 201) {
        resetFn();
        // refresh comments for this post
        const res2 = await fetch(`/api/posts/${post_id}`);
        const data2 = await res2.json();
        setActivePostComments((s) => ({ ...s, [post_id]: data2 }));
        fetchPosts();
      } else {
        const b = await res.json();
        alert("Error: " + (b.error || JSON.stringify(b)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pt-28 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold">Traveler Reviews</h2>
          <div className="flex gap-3">
            <button
              className="bg-white border px-3 py-2 rounded shadow hover:scale-105 transition"
              onClick={() => {
                setShowMine((s) => !s);
                setTimeout(fetchPosts, 10);
              }}
            >
              {showMine ? "All posts" : "My posts"}
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:scale-105 transition"
              onClick={() => setShowCreate((s) => !s)}
            >
              {showCreate ? "Cancel" : "Create a post"}
            </button>
          </div>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreatePost}
            className="mb-6 bg-white rounded-xl shadow p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  className="w-full mb-2 p-3 border rounded text-black"
                  placeholder="Title"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                />
                <textarea
                  className="w-full mb-2 p-3 border rounded text-black"
                  placeholder="Share your experience"
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    type="submit"
                  >
                    {uploading ? "Uploading..." : "Post"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border rounded"
                    onClick={() => {
                      setNewPost({ title: "", content: "", image_link: "" });
                      if (previewUrl) {
                        try {
                          URL.revokeObjectURL(previewUrl);
                        } catch (err) {}
                        setPreviewUrl(null);
                      }
                      setFile(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Image (optional)
                </label>
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
                        try {
                          URL.revokeObjectURL(previewUrl);
                        } catch (err) {}
                      }
                      setPreviewUrl(url);
                      setFile(f);
                    } else {
                      if (previewUrl) {
                        try {
                          URL.revokeObjectURL(previewUrl);
                        } catch (err) {}
                      }
                      setPreviewUrl(null);
                      setFile(null);
                    }
                  }}
                  className="w-full"
                />
                {previewUrl && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Selected image preview
                    </div>
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-40 object-cover rounded"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {file ? file.name : ""}{" "}
                      {file ? `• ${(file.size / 1024) | 0} KB` : ""}
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Or paste an image URL
                </div>
                <input
                  className="w-full mt-1 p-2 border rounded text-black"
                  placeholder="Image URL (optional)"
                  value={newPost.image_link}
                  onChange={(e) =>
                    setNewPost({ ...newPost, image_link: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        )}

        {/* barrier between create form and posts */}
        <div className="my-6">
          <div className="w-full border-t border-gray-200" />
        </div>

        {loading && <div className="text-center">Loading...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <div
              key={p.post_id}
              className="bg-white rounded-xl shadow-lg p-4 flex flex-col cursor-pointer"
              onClick={() => openPostDetail(p.post_id)}
            >
              <div className="mb-3">
                <img
                  src={p.image_link || "/placeholder-image"}
                  alt="post"
                  className="w-full h-40 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image";
                  }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{p.title}</h4>
                <div className="text-sm text-gray-600 mb-2">
                  by {p.username ? p.username : `user #${p.user_id}`} •{" "}
                  {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                </div>
                <p className="text-gray-700 mb-3">{p.content}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2 items-center">
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => handleLikePost(p.post_id)}
                  >
                    Like
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => toggleComments(p.post_id)}
                  >
                    {activePostComments[p.post_id] ? "Hide" : "Comments"}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  👍 {p.likes || 0} • 💬 {p.comments || 0}
                </div>
              </div>

              {activePostComments[p.post_id] && (
                <div className="mt-3 border-t pt-3">
                  <h5 className="font-medium mb-2">Comments</h5>
                  {activePostComments[p.post_id].comments &&
                    activePostComments[p.post_id].comments.length === 0 && (
                      <div className="text-sm text-gray-600">
                        No comments yet
                      </div>
                    )}
                  {activePostComments[p.post_id].comments &&
                    activePostComments[p.post_id].comments.map((c) => (
                      <div key={c.comment_id} className="mb-2">
                        <div className="text-sm text-gray-700">
                          {c.comment_text}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {c.username ? c.username : `user #${c.user_id}`} •{" "}
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString()
                            : ""}{" "}
                          • {c.rating ? `★ ${c.rating}` : ""}
                        </div>
                        <div>
                          <img
                            src={c.image_link || "/placeholder-image"}
                            alt="comment"
                            className="w-32 mt-1 rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-image";
                            }}
                          />
                        </div>
                        {/* render replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-4 mt-2">
                            {c.replies.map((r) => (
                              <div key={r.comment_id} className="mb-1">
                                <div className="text-sm text-gray-700">
                                  ↳ {r.comment_text}
                                </div>
                                <div className="text-xs text-gray-500">
                                  by{" "}
                                  {r.username
                                    ? r.username
                                    : `user #${r.user_id}`}{" "}
                                  •{" "}
                                  {r.created_at
                                    ? new Date(r.created_at).toLocaleString()
                                    : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                  <CommentForm
                    postId={p.post_id}
                    onSubmit={handleCreateComment}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Post detail modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white max-w-3xl w-full rounded-xl shadow-lg p-4 max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">
                  {selectedPost.post.title}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedPost.post.user_id === CURRENT_USER_ID && (
                    <button
                      className="text-sm text-red-600 border px-2 py-1 rounded hover:bg-red-50"
                      onClick={() =>
                        handleDeletePost(selectedPost.post.post_id)
                      }
                    >
                      Delete
                    </button>
                  )}
                  <button className="text-gray-500" onClick={closePostDetail}>
                    Close
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <img
                  src={selectedPost.post.image_link || "/placeholder-image"}
                  alt="post"
                  className="w-full h-60 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image";
                  }}
                />
                <div className="text-sm text-gray-600 mt-2">
                  by{" "}
                  {selectedPost.post.username
                    ? selectedPost.post.username
                    : `user #${selectedPost.post.user_id}`}
                </div>
                <p className="mt-2 text-gray-800">
                  {selectedPost.post.content}
                </p>
              </div>
              <div className="mt-4 border-t pt-3">
                <h4 className="font-medium mb-2">Comments</h4>
                {selectedPost.comments &&
                  selectedPost.comments.length === 0 && (
                    <div className="text-sm text-gray-600">No comments yet</div>
                  )}
                {selectedPost.comments &&
                  selectedPost.comments.map((c) => (
                    <div key={c.comment_id} className="mb-3">
                      <div className="text-sm font-medium">
                        {c.username ? c.username : `user #${c.user_id}`}
                      </div>
                      <div className="text-sm text-gray-700">
                        {c.comment_text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleString()
                          : ""}
                      </div>
                      {c.replies && c.replies.length > 0 && (
                        <div className="ml-4 mt-2">
                          {c.replies.map((r) => (
                            <div key={r.comment_id} className="mb-2">
                              <div className="text-sm font-medium">
                                {r.username ? r.username : `user #${r.user_id}`}
                              </div>
                              <div className="text-sm text-gray-700">
                                {r.comment_text}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <ReplyForm
                        postId={selectedPost.post.post_id}
                        parentId={c.comment_id}
                        onReply={async () => {
                          const res = await fetch(
                            `/api/posts/${selectedPost.post.post_id}`
                          );
                          const data = await res.json();
                          setSelectedPost(data);
                          fetchPosts();
                        }}
                      />
                    </div>
                  ))}
                <div className="mt-2">
                  <h5 className="font-medium">Add a comment</h5>
                  <CommentForm
                    postId={selectedPost.post.post_id}
                    onSubmit={async (postId, form, reset) => {
                      await handleCreateComment(postId, form, reset);
                      const res = await fetch(`/api/posts/${postId}`);
                      const data = await res.json();
                      setSelectedPost(data);
                      fetchPosts();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentForm({ postId, onSubmit }) {
  const [form, setForm] = useState({
    comment_text: "",
    rating: "",
    image_link: "",
  });
  function reset() {
    setForm({ comment_text: "", rating: "", image_link: "" });
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(postId, form, reset);
      }}
      className="mt-2"
    >
      <textarea
        className="w-full mb-2 p-2 border rounded"
        placeholder="Write a comment"
        value={form.comment_text}
        onChange={(e) => setForm({ ...form, comment_text: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className="p-2 border rounded"
          placeholder="Image URL (optional)"
          value={form.image_link}
          onChange={(e) => setForm({ ...form, image_link: e.target.value })}
        />
        <input
          className="p-2 border rounded w-24"
          placeholder="Rating"
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
        />
        <button
          className="px-3 py-1 bg-green-600 text-white rounded"
          type="submit"
        >
          Comment
        </button>
      </div>
    </form>
  );
}

function ReplyForm({ postId, parentId, onReply }) {
  const [text, setText] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!text) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          comment_text: text,
          parent_comment_id: parentId,
        }),
      });
      if (res.status === 201) {
        setText("");
        if (onReply) onReply();
      }
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <form onSubmit={submit} className="mt-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply..."
        className="w-full p-2 border rounded"
      />
      <div className="text-right mt-1">
        <button className="px-3 py-1 bg-gray-200 rounded" type="submit">
          Reply
        </button>
      </div>
    </form>
  );
}
