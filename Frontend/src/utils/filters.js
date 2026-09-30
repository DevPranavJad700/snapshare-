// Shared CSS filter values — used in CreatePost (preview) and Feed (display)
export const CSS_FILTERS = {
  Normal:  "none",
  Vivid:   "saturate(1.8) contrast(1.1)",
  Warm:    "sepia(0.3) saturate(1.4) brightness(1.05)",
  Cool:    "hue-rotate(15deg) saturate(0.9) brightness(1.1)",
  Vintage: "sepia(0.5) contrast(0.9) brightness(0.95)",
  Mono:    "grayscale(1) contrast(1.1)",
  Fade:    "brightness(1.15) saturate(0.7)",
  Drama:   "contrast(1.4) brightness(0.85) saturate(1.3)",
  Glow:    "brightness(1.2) saturate(1.5) hue-rotate(-10deg)",
};

export const FILTER_NAMES = Object.keys(CSS_FILTERS);

export const getFilterStyle = (name) => ({
  filter: CSS_FILTERS[name] || "none",
});
