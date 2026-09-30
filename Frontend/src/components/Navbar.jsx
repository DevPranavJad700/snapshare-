import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { notifApi } from "../utils/api";

/* Sun icon */
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

/* Moon icon */
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [spinning, setSpinning] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const active = (p) => pathname === p;

  const handleThemeToggle = () => {
    setSpinning(true);
    toggleTheme();
    setTimeout(() => setSpinning(false), 560);
  };

  // Fetch notifications if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await notifApi.getAll();
        if (isMounted) {
          setNotifications(res.data?.notifications || []);
          setUnreadCount(res.data?.unread || 0);
        }
      } catch (err) {
        // fail silently
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // refresh every 20s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotifs = async () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await notifApi.markAllRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        // fail silently
      }
    }
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand" onClick={() => navigate("/")}>
        <div className="navbar-logo">S</div>
        <span className="navbar-title">SnapShare</span>
      </div>

      {/* Inline search (desktop) */}
      <div className="navbar-search">
        <svg className="navbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="navbar-search-input"
          placeholder="Search posts, tags…"
          id="navbar-search-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              navigate(`/?search=${encodeURIComponent(e.target.value.trim())}`);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Right actions */}
      <div className="navbar-right">
        <button
          className={`nav-link ${active("/") ? "active" : ""}`}
          onClick={() => navigate("/")}
          id="nav-feed"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Feed
        </button>

        <button
          className={`nav-link ${active("/create-post") ? "active" : ""}`}
          onClick={() => navigate(isAuthenticated ? "/create-post" : "/login")}
          id="nav-create"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Create
        </button>

        {/* Real Notification Bell */}
        {isAuthenticated && (
          <div className="notif-wrapper" ref={notifRef}>
            <button
              className="nav-icon-btn"
              id="nav-notif"
              title="Notifications"
              onClick={handleToggleNotifs}
              aria-label="View notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {/* Notifications Dropdown Popover */}
            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} new</span>}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet 🍃</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`notif-item ${n.read ? "read" : "unread"}`}
                        onClick={() => {
                          setShowNotifs(false);
                          if (n.postId) navigate(`/posts/${n.postId}`);
                        }}
                      >
                        <div className="notif-icon-circle">
                          {n.type === "like" ? "❤️" : "💬"}
                        </div>
                        <div className="notif-text-col">
                          <p>
                            <strong>@{n.senderUsername}</strong>{" "}
                            {n.type === "like" ? "liked your post" : "commented on your post"}
                          </p>
                          {n.commentText && (
                            <span className="notif-snippet">"{n.commentText}"</span>
                          )}
                          <span className="notif-time">
                            {new Date(n.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {n.postImage && (
                          <img src={n.postImage} alt="Post" className="notif-post-thumb" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🌙☀️ Theme Toggle */}
        <button
          className={`theme-toggle ${spinning ? "spinning" : ""}`}
          onClick={handleThemeToggle}
          id="theme-toggle-btn"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Auth status or Avatar */}
        {isAuthenticated ? (
          <div className="user-menu-wrapper" ref={userMenuRef}>
            <div
              className="nav-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
              id="nav-profile"
              title={`Logged in as @${user?.username}`}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>

            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="user-dropdown-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-dropdown-meta">
                    <span className="user-name-bold">@{user?.username}</span>
                    <span className="user-role-label">Creator</span>
                  </div>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/profile");
                  }}
                >
                  👤 My Profile
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate("/");
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="nav-auth-buttons">
            <button
              className="btn-nav-login"
              onClick={() => navigate("/login")}
              id="nav-login-btn"
            >
              Sign In
            </button>
            <button
              className="btn-nav-register"
              onClick={() => navigate("/register")}
              id="nav-register-btn"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
