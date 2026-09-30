import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      {/* Floating emoji */}
      <div className="not-found-icon">🔭</div>

      {/* Big 404 */}
      <div className="not-found-number">404</div>

      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-desc">
        Looks like this page got lost in the cosmos. The photo you're looking for
        doesn't exist — but there are plenty more to explore!
      </p>

      <div className="not-found-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate("/")}
          id="nf-home-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Go Home
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/create-post")}
          id="nf-create-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Create Post
        </button>
      </div>
    </div>
  );
};

export default NotFound;
