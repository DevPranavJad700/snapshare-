import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Stories from "../components/Stories";
import { CSS_FILTERS } from "../utils/filters";
import { postsApi, commentsApi, tagsApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ── helpers ── */
function timeAgo(d) {
  if (!d) return "Just now";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getLikedPosts() {
  try { return JSON.parse(localStorage.getItem("snapshare_liked") || "{}"); }
  catch { return {}; }
}

/* ── Toast ── */
const Toast = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span className="toast-icon">{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
        {t.message}
      </div>
    ))}
  </div>
);

/* ── Skeleton Card ── */
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-head" style={{ height: 54, borderRadius: 0 }} />
    <div className="skeleton skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line short" />
    </div>
  </div>
);

/* ── Comments Modal Section ── */
const CommentsSection = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [newText,  setNewText]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    commentsApi.getForPost(postId)
      .then((r) => {
        if (isMounted) setComments(r.data.comments || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [postId]);

  const submit = async () => {
    if (!newText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await commentsApi.create(postId, {
        text: newText.trim(),
        username: user?.username || "Guest",
      });
      if (res.data?.comment) {
        setComments((p) => [res.data.comment, ...p]);
        setNewText("");
        setTimeout(() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
      }
    } catch (err) {
      alert("Failed to post comment: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await commentsApi.delete(commentId);
      setComments((p) => p.filter((c) => c._id !== commentId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="comments-section">
      <p className="comments-header">
        💬 Comments {!loading && `(${comments.length})`}
      </p>
      <div className="comments-list" ref={listRef}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Loading…
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            <span className="comments-empty-icon">💭</span>
            <span>No comments yet. Be the first!</span>
          </div>
        ) : (
          comments.map((c) => {
            const isCommentAuthor = user && c.authorId && user.id === c.authorId;
            return (
              <div key={c._id} className="comment-item">
                <div className="comment-avatar">
                  {(c.username || "A")[0].toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-username">@{c.username || "Anonymous"}</span>
                    <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    {isCommentAuthor && (
                      <button
                        onClick={() => deleteComment(c._id)}
                        className="comment-inline-del"
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add comment input */}
      <div className="comment-add-form">
        <input
          className="comment-add-input"
          placeholder={user ? `Comment as @${user.username}…` : "Add a comment…"}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          maxLength={300}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          id={`comment-input-${postId}`}
        />
        <button
          className="comment-send-btn"
          onClick={submit}
          disabled={submitting || !newText.trim()}
          aria-label="Send comment"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ── Post Modal ── */
const PostModal = ({ post, onClose, onLike, likedMap, onShare, onEdit, onDelete, currentUser }) => {
  const navigate = useNavigate();
  const liked = !!likedMap[post._id];
  const authorName = post.authorUsername || "Creator";
  const isOwner = currentUser && post.authorId && currentUser.id === post.authorId;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        <div className="modal-img-side">
          <img
            src={post.image}
            alt={post.caption || "SnapShare Post"}
            style={{ filter: CSS_FILTERS[post.filter] || "none" }}
            onError={(e) => { e.target.src = `https://picsum.photos/seed/${post._id}/800/800`; }}
          />
          <button className="modal-close" onClick={onClose} id="modal-close" aria-label="Close modal">✕</button>
        </div>

        {/* Info + Comments */}
        <div className="modal-info-side">
          {/* Author */}
          <div className="modal-author">
            <div className="modal-author-avatar">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p className="modal-author-name">@{authorName}</p>
              <p className="modal-author-sub">{timeAgo(post.createdAt)} • {post.views || 1} views</p>
            </div>
            {isOwner && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-icon-subtle"
                  onClick={() => { onClose(); onEdit(post); }}
                  title="Edit post"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon-subtle danger"
                  onClick={() => { onClose(); onDelete(post); }}
                  title="Delete post"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Caption + tags */}
          <div className="modal-caption-area">
            {post.caption && <p className="modal-caption">{post.caption}</p>}
            {post.tags?.length > 0 && (
              <div className="tag-list">
                {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              className={`modal-action-btn ${liked ? "liked" : ""}`}
              onClick={() => onLike(post)}
              id={`modal-like-${post._id}`}
            >
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {post.likes ?? 0} Likes
            </button>
            <button
              className="modal-action-btn"
              onClick={() => onShare(post)}
              id={`modal-share-${post._id}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
            <button
              className="modal-action-btn"
              onClick={() => navigate(`/posts/${post._id}`)}
              title="Open full dedicated page"
            >
              ↗ Full Page
            </button>
          </div>

          {/* Comments */}
          <CommentsSection postId={post._id} />
        </div>
      </div>
    </div>
  );
};

/* ── Post Card ── */
const PostCard = ({ post, onClick, onLike, onDelete, onEdit, onShare, likedMap, currentUser }) => {
  const navigate = useNavigate();
  const liked = !!likedMap[post._id];
  const cssFilter = CSS_FILTERS[post.filter] || "none";
  const authorName = post.authorUsername || "Creator";
  const isOwner = currentUser && post.authorId && currentUser.id === post.authorId;

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <div className="post-card-avatar">{authorName.charAt(0).toUpperCase()}</div>
        <div className="post-card-meta" onClick={() => navigate(`/posts/${post._id}`)}>
          <span className="post-card-username">@{authorName}</span>
          <span className="post-card-time">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Actions for author */}
        <div className="post-card-header-actions">
          {isOwner && (
            <>
              <button
                className="post-card-action-icon"
                onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                title="Edit caption and tags"
              >
                ✏️
              </button>
              <button
                className="post-card-action-icon delete"
                onClick={(e) => { e.stopPropagation(); onDelete(post); }}
                title="Delete post"
                id={`delete-${post._id}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      <div
        className="post-card-img"
        onClick={() => onClick(post)}
        style={{ cursor: "pointer" }}
      >
        <img
          src={post.image}
          alt={post.caption || "Post"}
          loading="lazy"
          style={{ filter: cssFilter }}
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${post._id}/600/600`; }}
        />
        <div className="post-card-img-overlay">
          <span className="overlay-stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {post.likes ?? 0}
          </span>
          <span className="overlay-stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            View Details
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="post-card-actions">
        <button
          className={`action-btn ${liked ? "liked" : ""}`}
          onClick={(e) => { e.stopPropagation(); onLike(post); }}
          id={`like-${post._id}`}
        >
          <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {post.likes ?? 0}
        </button>
        <button className="action-btn" onClick={() => onClick(post)} id={`comment-${post._id}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Comment
        </button>
        <button
          className="action-btn ml-auto"
          onClick={() => onShare(post)}
          title="Share post"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Caption + tags */}
      <div className="post-card-body">
        {post.caption && <p className="post-card-caption">{post.caption}</p>}
        {post.tags?.length > 0 && (
          <div className="tag-list">
            {post.tags.map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

/* ================================================================
   FEED PAGE
   ================================================================ */
const Feed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [posts,        setPosts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState(searchParams.get("search") || "");
  const [activeTag,    setActiveTag]    = useState("");
  const [trending,     setTrending]     = useState([]);
  const [totalPosts,   setTotalPosts]   = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedMap,     setLikedMap]     = useState(getLikedPosts);
  const [toasts,       setToasts]       = useState([]);

  // In-line Edit Modal
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editTags,    setEditTags]    = useState("");
  const [savingEdit,  setSavingEdit]  = useState(false);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef(null);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  }, []);

  /* ── fetch posts ── */
  const fetchPosts = useCallback(async (pg = 1, reset = true) => {
    pg === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const params = { page: pg, limit: 12 };
      if (search)    params.search = search;
      if (activeTag) params.tag = activeTag;

      const res = await postsApi.getAll(params);
      const incoming = res.data.posts || [];

      setPosts((prev) => (reset ? incoming : [...prev, ...incoming]));
      setTotalPages(res.data.totalPages || 1);
      setTotalPosts(res.data.total || 0);
      setPage(pg);
    } catch {
      addToast("Couldn't load posts — is the server running?", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, activeTag, addToast]);

  /* ── fetch trending ── */
  const fetchTrending = useCallback(async () => {
    try {
      const res = await tagsApi.getTrending();
      setTrending(res.data.trending || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchPosts(1, true);
    fetchTrending();
  }, [search, activeTag]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          fetchPosts(page + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages, fetchPosts]);

  /* ── like toggle ── */
  const handleLike = useCallback(async (post) => {
    const wasLiked = !!likedMap[post._id];
    const action   = wasLiked ? "unlike" : "like";

    // Optimistic update
    setLikedMap((m) => {
      const n = { ...m };
      wasLiked ? delete n[post._id] : (n[post._id] = true);
      return n;
    });
    setPosts((p) =>
      p.map((x) =>
        x._id === post._id
          ? { ...x, likes: Math.max(0, (x.likes ?? 0) + (wasLiked ? -1 : 1)) }
          : x
      )
    );
    if (selectedPost?._id === post._id) {
      setSelectedPost((s) => ({
        ...s,
        likes: Math.max(0, (s.likes ?? 0) + (wasLiked ? -1 : 1)),
      }));
    }

    // Persist liked state in local storage
    const updated = { ...likedMap };
    wasLiked ? delete updated[post._id] : (updated[post._id] = true);
    localStorage.setItem("snapshare_liked", JSON.stringify(updated));

    try {
      const res = await postsApi.like(post._id, action);
      if (res.data?.likes !== undefined) {
        setPosts((p) =>
          p.map((x) => (x._id === post._id ? { ...x, likes: res.data.likes } : x))
        );
      }
    } catch { /* silent */ }
  }, [likedMap, selectedPost]);

  /* ── delete ── */
  const handleDelete = useCallback(async (post) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await postsApi.delete(post._id);
      setPosts((p) => p.filter((x) => x._id !== post._id));
      setTotalPosts((n) => Math.max(0, n - 1));
      if (selectedPost?._id === post._id) setSelectedPost(null);
      addToast("Post deleted successfully.", "info");
      fetchTrending();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete post.", "error");
    }
  }, [selectedPost, addToast, fetchTrending]);

  /* ── open edit modal ── */
  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditTags(Array.isArray(post.tags) ? post.tags.join(", ") : "");
  };

  /* ── save edit ── */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      setSavingEdit(true);
      const parsedTags = editTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await postsApi.update(editingPost._id, {
        caption: editCaption.trim(),
        tags: parsedTags,
      });

      if (res.data?.post) {
        const updated = res.data.post;
        setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        if (selectedPost?._id === updated._id) setSelectedPost(updated);
        addToast("Post updated successfully! ✨", "success");
        setEditingPost(null);
        fetchTrending();
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update post", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── share post ── */
  const handleShare = async (post) => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(postUrl);
      addToast("Post link copied to clipboard! 🔗", "success");
    }
  };

  const handleTagClick = (tag) => {
    setActiveTag((p) => (p === tag ? "" : tag));
    setSearch("");
  };

  const tabs = ["All", ...trending.slice(0, 6).map((t) => t.tag)];

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="feed-hero">
        <h1>✨ Explore the World</h1>
        <p>Discover stunning photos shared by creators across the globe</p>
      </div>

      <div className="feed-layout">
        {/* ── MAIN COLUMN ── */}
        <div className="feed-main">
          {/* Stories */}
          <Stories onCreatePost={() => navigate(user ? "/create-post" : "/login")} />

          {/* Search */}
          <div className="search-bar-wrapper">
            <svg className="search-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-bar"
              placeholder="Search by caption or #tag…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTag(""); }}
              id="feed-search"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`filter-tab ${
                  (tab === "All" && !activeTag && !search) || (tab !== "All" && activeTag === tab)
                    ? "active" : ""
                }`}
                onClick={() => { tab === "All" ? (setActiveTag(""), setSearch("")) : handleTagClick(tab); }}
                id={`tab-${tab}`}
              >
                {tab === "All" ? "✨ All" : `#${tab}`}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="feed-grid">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : posts.length === 0 ? (
              <div className="feed-empty">
                <span className="empty-icon">📷</span>
                <h3>{search || activeTag ? "No results found" : "No posts yet"}</h3>
                <p>
                  {search || activeTag
                    ? "Try a different search term or tag."
                    : "Be the first to share a moment with the community!"}
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: "auto", marginTop: 8 }}
                  onClick={() => navigate(user ? "/create-post" : "/login")}
                >
                  Create First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onClick={setSelectedPost}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onEdit={handleOpenEdit}
                  onShare={handleShare}
                  likedMap={likedMap}
                  currentUser={user}
                />
              ))
            )}
          </div>

          {/* Sentinel for Infinite Scroll & Load More Button */}
          {!loading && page < totalPages && (
            <div className="load-more-wrapper" ref={sentinelRef}>
              <button
                className="load-more-btn"
                disabled={loadingMore}
                onClick={() => fetchPosts(page + 1, false)}
                id="load-more-btn"
              >
                {loadingMore ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" opacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Loading more moments…
                  </>
                ) : (
                  <>Load more posts ({totalPosts - posts.length} remaining)</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="feed-sidebar">
          {/* App stats */}
          <div className="sidebar-card">
            <p className="sidebar-title">📊 Community Stats</p>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Total Moments</span>
              <span className="sidebar-stat-value">{totalPosts}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Trending Tags</span>
              <span className="sidebar-stat-value">{trending.length}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Liked by You</span>
              <span className="sidebar-stat-value">{Object.keys(likedMap).length}</span>
            </div>
          </div>

          {/* Trending tags */}
          {trending.length > 0 && (
            <div className="sidebar-card">
              <p className="sidebar-title">🔥 Trending Tags</p>
              {trending.slice(0, 10).map(({ tag, count }) => (
                <div
                  key={tag}
                  className="trending-row"
                  onClick={() => handleTagClick(tag)}
                  id={`trend-${tag}`}
                >
                  <span className="trending-name">#{tag}</span>
                  <span className="trending-count">{count} {count === 1 ? "post" : "posts"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick nav */}
          <div className="sidebar-card">
            <p className="sidebar-title">🚀 Quick Actions</p>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "11px 20px" }}
              onClick={() => navigate(user ? "/create-post" : "/login")}
              id="sidebar-create-btn"
            >
              + Create Post
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: "10px 20px", marginTop: 10 }}
              onClick={() => navigate(user ? "/profile" : "/login")}
              id="sidebar-profile-btn"
            >
              👤 {user ? `@${user.username}` : "Sign In"}
            </button>
          </div>
        </aside>
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => navigate(user ? "/create-post" : "/login")}
        id="fab"
        aria-label="Create post"
      >
        +
      </button>

      {/* Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onShare={handleShare}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          likedMap={likedMap}
          currentUser={user}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="modal-backdrop" onClick={() => setEditingPost(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Post</h3>
              <button onClick={() => setEditingPost(null)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label>Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Update your caption..."
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="travel, sunset, photography"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="btn-primary">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Feed;
