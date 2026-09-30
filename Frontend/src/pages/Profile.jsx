import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CSS_FILTERS } from "../utils/filters";
import { postsApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Skeleton ── */
const SkeletonGrid = () =>
  Array.from({ length: 9 }).map((_, i) => (
    <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: "var(--r-md)" }} />
  ));

/* ================================================================
   PROFILE PAGE
   ================================================================ */
const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        // If user is authenticated, query posts by author
        const params = { limit: 100 };
        if (user?.id) {
          params.author = user.id;
        }

        const res = await postsApi.getAll(params);
        if (isMounted) {
          let userPosts = res.data?.posts || [];
          // If no posts found specifically with authorId (e.g. legacy posts), and user is logged in,
          // also include posts where authorUsername matches
          if (userPosts.length === 0 && user?.username) {
            const allRes = await postsApi.getAll({ limit: 100 });
            userPosts = (allRes.data?.posts || []).filter(
              (p) => p.authorUsername === user.username || p.authorId === user.id
            );
          }
          setPosts(userPosts);
        }
      } catch (err) {
        // fail gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserPosts();
    return () => { isMounted = false; };
  }, [user]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="page-container">
        <div className="profile-auth-prompt">
          <div className="prompt-icon">👤</div>
          <h2>Join SnapShare to Create Your Profile</h2>
          <p>Sign in to view your uploaded moments, track likes, and manage your account.</p>
          <div className="prompt-actions">
            <Link to="/login" className="btn btn-primary">Sign In</Link>
            <Link to="/register" className="btn btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const username = user?.username || "creator";
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  return (
    <div className="page-container">
      <div className="profile-page">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">{username.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div className="profile-title-row">
              <p className="profile-name">@{username}</p>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="btn-signout-small"
                title="Sign out of account"
              >
                Sign Out
              </button>
            </div>
            <p className="profile-bio">
              {user?.bio || "📸 Capturing moments, one click at a time. Welcome to my gallery."}
            </p>
            <div className="profile-stats">
              <div>
                <div className="profile-stat-val">{loading ? "…" : posts.length}</div>
                <div className="profile-stat-lbl">Posts</div>
              </div>
              <div>
                <div className="profile-stat-val">{loading ? "…" : totalLikes}</div>
                <div className="profile-stat-lbl">Likes</div>
              </div>
              <div>
                <div className="profile-stat-val">{loading ? "…" : totalViews}</div>
                <div className="profile-stat-lbl">Views</div>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "11px 24px", fontSize: 13 }}
            onClick={() => navigate("/create-post")}
            id="profile-create-btn"
          >
            + New Post
          </button>
        </div>

        {/* Grid label */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
          paddingBottom: 14, borderBottom: "1px solid var(--glass-border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              My Gallery ({posts.length})
            </span>
          </div>
        </div>

        {/* Post grid */}
        <div className="profile-grid">
          {loading ? (
            <SkeletonGrid />
          ) : posts.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
              <span style={{ fontSize: 50 }}>📷</span>
              <p style={{ color: "var(--text-muted)", marginTop: 12 }}>You haven't posted any moments yet.</p>
              <button
                className="btn btn-primary"
                style={{ width: "auto", marginTop: 16 }}
                onClick={() => navigate("/create-post")}
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="profile-thumb"
                onClick={() => setSelected(post)}
                id={`profile-thumb-${post._id}`}
              >
                <img
                  src={post.image}
                  alt={post.caption || "Post thumbnail"}
                  loading="lazy"
                  style={{ filter: CSS_FILTERS[post.filter] || "none" }}
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/${post._id}/400/400`; }}
                />
                <div className="profile-thumb-overlay">
                  <span>❤️ {post.likes ?? 0}</span>
                  <span>👁️ {post.views ?? 1}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox / Post details dialog */}
      {selected && (
        <div className="lightbox-backdrop" onClick={() => setSelected(null)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.image}
              alt={selected.caption}
              style={{ filter: CSS_FILTERS[selected.filter] || "none" }}
            />
            <div className="lightbox-info">
              <p style={{ fontWeight: 600 }}>{selected.caption || "Untitled moment"}</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                {timeAgo(selected.createdAt)} • ❤️ {selected.likes ?? 0} likes • 👁️ {selected.views ?? 1} views
              </p>
              {selected.tags?.length > 0 && (
                <div className="tag-list" style={{ marginTop: 8 }}>
                  {selected.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "8px 16px", fontSize: 13 }}
                  onClick={() => {
                    const id = selected._id;
                    setSelected(null);
                    navigate(`/posts/${id}`);
                  }}
                >
                  Open Full Post Page ↗
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
