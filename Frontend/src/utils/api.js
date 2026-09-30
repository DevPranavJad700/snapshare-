import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("snapshare_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration or error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: If unauthorized and had token, clear token
      if (localStorage.getItem("snapshare_token")) {
        // Dispatch custom event so AuthContext can sync if needed
        window.dispatchEvent(new CustomEvent("snapshare:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

/* ================================================================
   API HELPER MODULES
   ================================================================ */

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const postsApi = {
  getAll: (params) => api.get("/posts", { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  create: (formData) =>
    api.post("/create-post", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id, action) => api.patch(`/posts/${id}/like`, { action }),
  getStories: () => api.get("/stories"),
};

export const commentsApi = {
  getForPost: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

export const notifApi = {
  getAll: () => api.get("/notifications"),
  markAllRead: () => api.patch("/notifications/mark-read"),
};

export const tagsApi = {
  getTrending: () => api.get("/trending-tags"),
};

export default api;
