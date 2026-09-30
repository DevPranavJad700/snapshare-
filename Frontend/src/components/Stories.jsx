import React, { useState, useEffect } from "react";
import { postsApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import StoryViewer from "./StoryViewer";

// Fallback demo stories if database doesn't have 48h posts yet
const FALLBACK_STORIES = [
  {
    _id: "demo-1",
    authorUsername: "alex_travels",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    caption: "Golden hour at the turquoise coast 🌊✨",
    filter: "Warm",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: "demo-2",
    authorUsername: "maria_art",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    caption: "Morning light in Kyoto 🌸",
    filter: "Vintage",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: "demo-3",
    authorUsername: "sam_peaks",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    caption: "Above the clouds at 4,000m 🏔️",
    filter: "Drama",
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    _id: "demo-4",
    authorUsername: "priya_lens",
    image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80",
    caption: "Sunshine filtering through misty redwoods 🌲",
    filter: "Vivid",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

const Stories = ({ onCreatePost }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStories = async () => {
      try {
        const res = await postsApi.getStories();
        if (isMounted) {
          const apiStories = res.data?.stories || [];
          if (apiStories.length > 0) {
            setStories(apiStories);
          } else {
            setStories(FALLBACK_STORIES);
          }
        }
      } catch (err) {
        if (isMounted) {
          setStories(FALLBACK_STORIES);
        }
      }
    };
    fetchStories();
    return () => {
      isMounted = false;
    };
  }, []);

  const openStory = (index) => {
    setActiveStoryIndex(index);
  };

  const closeStory = () => {
    setActiveStoryIndex(null);
  };

  return (
    <>
      <div className="stories-bar" aria-label="Stories">
        {/* Your Story item */}
        <button
          className="story-item"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          onClick={onCreatePost}
          id="story-yours"
          aria-label="Add your story"
        >
          <div className="story-ring yours">
            <div className="story-avatar">
              <span>{user ? user.username.charAt(0).toUpperCase() : "📸"}</span>
            </div>
            <span className="story-add-icon">+</span>
          </div>
          <span className="story-name">Your Story</span>
        </button>

        {/* Real stories */}
        {stories.map((s, idx) => {
          const name = s.authorUsername || "Creator";
          return (
            <button
              key={s._id || idx}
              className="story-item"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={() => openStory(idx)}
              id={`story-${idx}`}
              aria-label={`${name}'s story`}
            >
              <div className="story-ring">
                <div className="story-avatar">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="story-name">{name}</span>
            </button>
          );
        })}
      </div>

      {/* Full-screen Story Viewer Modal */}
      {activeStoryIndex !== null && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={closeStory}
        />
      )}
    </>
  );
};

export default Stories;
