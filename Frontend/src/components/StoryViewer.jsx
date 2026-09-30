import React, { useState, useEffect, useRef } from "react";
import { getFilterStyle } from "../utils/filters";

const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewer = ({ stories, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef(null);

  const currentStory = stories[currentIndex];

  // Advance to next story
  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  // Back to previous story
  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  // Timer loop for progress bar
  useEffect(() => {
    if (isPaused) return;

    const stepMs = 50;
    const increment = (stepMs / STORY_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPaused, stories.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") nextStory();
      else if (e.key === "ArrowLeft") prevStory();
      else if (e.key === " ") setIsPaused((p) => !p);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, stories.length]);

  if (!currentStory) return null;

  const author = currentStory.authorUsername || "Creator";
  const filterStyle = getFilterStyle(currentStory.filter || "Normal");

  return (
    <div
      className="story-modal-overlay"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="story-viewer-card" onClick={(e) => e.stopPropagation()}>
        {/* Progress Bars */}
        <div className="story-progress-container">
          {stories.map((s, idx) => {
            let width = 0;
            if (idx < currentIndex) width = 100;
            else if (idx === currentIndex) width = progress;
            return (
              <div key={s._id || idx} className="story-progress-bar-bg">
                <div
                  className="story-progress-fill"
                  style={{ width: `${width}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="story-header">
          <div className="story-author-info">
            <div className="story-avatar-small">
              {author.charAt(0).toUpperCase()}
            </div>
            <span className="story-username">@{author}</span>
            <span className="story-timestamp">
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="story-header-actions">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="story-control-btn"
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
            <button onClick={onClose} className="story-close-btn" title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Media Frame */}
        <div className="story-media-container">
          <img
            src={currentStory.image}
            alt={currentStory.caption || "Story"}
            className="story-media-img"
            style={filterStyle}
          />

          {/* Invisible Left / Right tap zones */}
          <div
            className="story-nav-tap-left"
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
          />
          <div
            className="story-nav-tap-right"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />
        </div>

        {/* Bottom Caption Overlay */}
        {currentStory.caption && (
          <div className="story-caption-overlay">
            <p>{currentStory.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
