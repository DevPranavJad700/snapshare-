import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { postsApi, commentsApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getFilterStyle } from "../utils/filters";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editTags, setEditTags] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch post and comments
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [postRes, commRes] = await Promise.all([
          postsApi.getOne(id),
          commentsApi.getForPost(id),
        ]);

        if (isMounted) {
          const p = postRes.data.post;
          setPost(p);
          setLikesCount(p.likes || 0);
          setEditCaption(p.caption || "");
          setEditTags(Array.isArray(p.tags) ? p.tags.join(", ") : "");
          setComments(commRes.data.comments || []);

          // Check if liked locally
          const likedPosts = JSON.parse(localStorage.getItem("snapshare_liked") || "{}");
          setIsLiked(!!likedPosts[id]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load post. It may have been deleted.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Like
  const handleLike = async () => {
    const action = isLiked ? "unlike" : "like";
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    // update localStorage
    const likedPosts = JSON.parse(localStorage.getItem("snapshare_liked") || "{}");
    if (nextLiked) likedPosts[id] = true;
    else delete likedPosts[id];
    localStorage.setItem("snapshare_liked", JSON.stringify(likedPosts));

    try {
      const res = await postsApi.like(id, action);
      if (res.data?.likes !== undefined) setLikesCount(res.data.likes);
    } catch {
      // Rollback
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  // Handle Share / Copy Link
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const res = await commentsApi.create(id, { text: newComment.trim() });
      if (res.data?.comment) {
        setComments((prev) => [res.data.comment, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      alert("Failed to post comment: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await postsApi.delete(id);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const parsedTags = editTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await postsApi.update(id, {
        caption: editCaption.trim(),
        tags: parsedTags,
      });

      if (res.data?.post) {
        setPost(res.data.post);
        setShowEditModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-skeleton">
          <div className="skeleton-image pulse" />
          <div className="skeleton-info">
            <div className="skeleton-line pulse" style={{ width: "60%" }} />
            <div className="skeleton-line pulse" style={{ width: "90%" }} />
            <div className="skeleton-line pulse" style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-error">
          <div className="error-icon">🔍</div>
          <h2>Post Not Found</h2>
          <p>{error || "This post doesn't exist or was removed."}</p>
          <Link to="/" className="btn-primary">
            ← Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && post.authorId && user.id === post.authorId;
  const authorName = post.authorUsername || "Creator";
  const filterStyle = getFilterStyle(post.filter || "Normal");

  return (
    <div className="post-detail-page">
      {/* Back button */}
      <div className="detail-top-nav">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>
        <div className="detail-top-actions">
          <button onClick={handleShare} className="btn-share" title="Copy shareable link">
            {copied ? "✓ Copied Link!" : "🔗 Share Link"}
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-edit-post"
                title="Edit caption & tags"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDeletePost}
                className="btn-delete-post"
                title="Delete post permanently"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="post-detail-card">
        {/* Left: Image Container */}
        <div className="post-detail-media-container">
          <img
            src={post.image}
            alt={post.caption || "SnapShare Post"}
            className="post-detail-img"
            style={filterStyle}
          />
          {post.filter && post.filter !== "Normal" && (
            <span className="post-filter-badge">{post.filter}</span>
          )}
        </div>

        {/* Right: Info & Comments */}
        <div className="post-detail-content">
          {/* Author Header */}
          <div className="post-detail-author">
            <div className="author-avatar">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="author-meta">
              <span className="author-name">@{authorName}</span>
              <span className="post-date">
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Caption */}
          {post.caption && <p className="post-detail-caption">{post.caption}</p>}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-detail-tags">
              {post.tags.map((t, idx) => (
                <Link key={idx} to={`/?tag=${t}`} className="tag-chip">
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Metrics bar */}
          <div className="post-detail-metrics">
            <button
              onClick={handleLike}
              className={`metric-like-btn ${isLiked ? "liked" : ""}`}
            >
              <span className="heart-icon">{isLiked ? "❤️" : "🤍"}</span>
              <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
            </button>

            <div className="metric-views">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{post.views || 1} views</span>
            </div>
          </div>

          <hr className="detail-separator" />

          {/* Comments Section */}
          <div className="post-comments-header">
            <h3>Comments ({comments.length})</h3>
          </div>

          <div className="post-comments-list">
            {comments.length === 0 ? (
              <p className="no-comments-prompt">No comments yet. Start the conversation!</p>
            ) : (
              comments.map((c) => {
                const isCommentAuthor = user && c.authorId && user.id === c.authorId;
                return (
                  <div key={c._id} className="comment-bubble">
                    <div className="comment-main">
                      <span className="comment-user">@{c.username}</span>
                      <p className="comment-text">{c.text}</p>
                    </div>
                    {isCommentAuthor && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="comment-del-btn"
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="comment-input-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? `Comment as @${user.username}...` : "Write a comment..."}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="comment-submit-btn"
            >
              {submittingComment ? "..." : "Post"}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Post</h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close">
                ×
              </button>
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
                  placeholder="photography, nature, sunset"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
    </div>
  );
};

export default PostDetail;
