import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CSS_FILTERS, FILTER_NAMES } from "../utils/filters";
import { postsApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const MAX_CAPTION = 200;
const MAX_TAGS    = 8;

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

/* ================================================================
   CREATE POST
   ================================================================ */
const CreatePost = () => {
  const navigate    = useNavigate();
  const fileRef     = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const [preview,     setPreview]     = useState(null);
  const [caption,     setCaption]     = useState("");
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState("");
  const [filter,      setFilter]      = useState("Normal");
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [toasts,      setToasts]      = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/create-post" } } });
    }
  }, [isAuthenticated, navigate]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  /* ── file handling ── */
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { addToast("Please select a valid image.", "error"); return; }
    if (file.size > 10 * 1024 * 1024)   { addToast("Image must be < 10 MB.",       "error"); return; }
    setPreview(URL.createObjectURL(file));
  };

  const onFileChange = (e) => handleFile(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
    if (fileRef.current && file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
    }
  };

  /* ── tag input ── */
  const addTag = (raw) => {
    const clean = raw.replace(/^#+/, "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!clean) return;
    if (tags.includes(clean)) { addToast(`#${clean} already added.`, "info"); return; }
    if (tags.length >= MAX_TAGS) { addToast(`Max ${MAX_TAGS} tags allowed.`, "error"); return; }
    setTags((p) => [...p, clean]);
  };

  const onTagKeyDown = (e) => {
    if (["Enter", " ", ","].includes(e.key)) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((p) => p.slice(0, -1));
    }
  };

  const removeTag = (t) => setTags((p) => p.filter((x) => x !== t));

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file)          { addToast("Please select an image.",  "error"); return; }
    if (!caption.trim()){ addToast("Please add a caption.",    "error"); return; }

    const formData = new FormData();
    formData.append("image",   file);
    formData.append("caption", caption.trim());
    formData.append("tags",    JSON.stringify(tags));
    formData.append("filter",  filter);

    setSubmitting(true);
    setProgress(10);
    const timer = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 300);

    try {
      await postsApi.create(formData);
      clearInterval(timer);
      setProgress(100);
      addToast("Post published! 🎉", "success");
      setTimeout(() => navigate("/"), 1400);
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      addToast(err.response?.data?.message || "Upload failed. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── render ── */
  return (
    <div className="page-container create-page">
      <div className="create-form-wrapper">
        {/* Header */}
        <div className="create-form-header">
          <div className="form-icon">📸</div>
          <h1>Share a Moment</h1>
          <p>Upload a photo and let the world see it</p>
        </div>

        <form onSubmit={handleSubmit} id="create-post-form">
          {/* Upload zone */}
          <div
            className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              name="image"
              accept="image/*"
              onChange={onFileChange}
              id="image-input"
            />
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Preview"
                  className="upload-preview"
                  style={{ filter: CSS_FILTERS[filter] }}
                />
                <div className="upload-preview-mask">
                  <span>🔄 Click to change image</span>
                </div>
              </>
            ) : (
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="upload-title">
                  {isDragOver ? "Drop it here!" : "Drag & drop or click to upload"}
                </span>
                <span className="upload-hint">PNG, JPG, WEBP — up to 10 MB</span>
              </div>
            )}
          </div>

          {/* Filters (only when image selected) */}
          {preview && (
            <div className="form-group">
              <span className="form-label">Filter</span>
              <div className="filter-strip">
                {FILTER_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`filter-option ${filter === name ? "selected" : ""}`}
                    onClick={() => setFilter(name)}
                    id={`filter-${name}`}
                  >
                    <div className="filter-thumb">
                      <img
                        src={preview}
                        alt={name}
                        style={{ filter: CSS_FILTERS[name] }}
                      />
                    </div>
                    <span className="filter-label">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="form-group">
            <label className="form-label" htmlFor="caption-input">Caption</label>
            <textarea
              id="caption-input"
              className="form-input"
              placeholder="Write a caption for your photo…"
              rows={3}
              maxLength={MAX_CAPTION}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className={`char-counter ${caption.length > MAX_CAPTION * 0.85 ? "warn" : ""}`}>
              {caption.length} / {MAX_CAPTION}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags (max {MAX_TAGS})</label>
            <div
              className="tags-input-wrapper"
              onClick={() => document.getElementById("tag-raw-input").focus()}
            >
              {tags.map((t) => (
                <span key={t} className="tag-chip">
                  {t}
                  <button
                    type="button"
                    className="tag-chip-x"
                    onClick={(e) => { e.stopPropagation(); removeTag(t); }}
                    aria-label={`Remove tag ${t}`}
                  >×</button>
                </span>
              ))}
              <input
                id="tag-raw-input"
                className="tags-raw-input"
                placeholder={tags.length < MAX_TAGS ? "Type a tag and press Enter…" : "Max tags reached"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                disabled={tags.length >= MAX_TAGS}
              />
            </div>
          </div>

          {/* Progress */}
          {submitting && (
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="submit"
              className="btn btn-primary"
              id="submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" opacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Uploading to ImageKit…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Publish Post
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              id="cancel-btn"
              onClick={() => navigate("/")}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Toast toasts={toasts} />
    </div>
  );
};

export default CreatePost;
