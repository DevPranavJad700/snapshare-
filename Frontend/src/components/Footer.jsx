import React from "react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-logo">S</div>
          <span className="footer-brand-name">SnapShare</span>
        </div>

        {/* Nav links */}
        <nav className="footer-links" aria-label="Footer navigation">
          <a className="footer-link" onClick={() => navigate("/")} href="#" id="footer-feed">Feed</a>
          <a className="footer-link" onClick={() => navigate("/create-post")} href="#" id="footer-create">Create Post</a>
          <a className="footer-link" onClick={() => navigate("/profile")} href="#" id="footer-profile">Profile</a>
        </nav>

        {/* Copyright */}
        <p className="footer-copy">
          © {year} SnapShare · Made with ❤️ using React, Express & ImageKit
        </p>
      </div>
    </footer>
  );
};

export default Footer;
