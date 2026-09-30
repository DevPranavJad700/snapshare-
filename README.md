<div align="center">

# 📸 SnapShare

### *Share Your World — Premium Full-Stack Social Photo Platform*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/Tests-16%2F16%20Passed-brightgreen)](https://github.com/DevPranavJad700/snapshare-)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

<br/>

**SnapShare** is a production-grade social photo sharing web application crafted with a sleek dark/light glassmorphic UI, JWT user authentication, real-time image filters, community discussions, expiring stories, automated rate limiting, and a comprehensive backend test suite.

[Explore Features](#-key-features) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [API Docs](#-api-endpoints) • [Architecture](#-project-structure)

</div>

---

## ✨ Key Features

### 🎨 Visual & User Experience
- **🌗 Seamless Dark / Light Theme**: Dynamic CSS variables with smooth transitions, animated theme toggle button, and anti-FOUC initialization.
- **🖼️ 9 Live Image Filters**: Real-time CSS filter previews (*Vivid*, *Warm*, *Cool*, *Vintage*, *Mono*, *Fade*, *Drama*, *Glow*, *Normal*) during upload.
- **📱 Instagram-Style Stories**: Auto-progressing progress bars, tap to pause, keyboard arrows navigation (`←`/`→`), and Escape to dismiss.
- **✨ Micro-Interactions**: Glassmorphic modals, floating action button (FAB), skeleton loaders, toast alerts, and responsive grid layouts.

### 🔐 Security & Identity
- **User Authentication**: Secure registration and login powered by `bcryptjs` (salt 10) and signed `jsonwebtoken` (JWT).
- **Owner-Protected Resources**: Strict authorization preventing users from editing or deleting posts and comments belonging to others.
- **Multi-Tier Rate Limiting**: Dedicated rate limits for general queries (200 req/15 min), auth attempts (15 req/15 min), and uploads (30 req/hr).

### 💬 Social Interactions
- **Optimistic Likes**: Instant UI feedback with server sync and like counts.
- **Threaded Comments**: Real-time comment submission attributed to the authenticated creator.
- **🔔 Live Notifications**: Real-time unread notification badge on the navbar with a dropdown drawer for likes and comments.
- **✏️ In-Place Post Editing**: Authors can update captions and hashtags directly from the feed or post details.
- **🔗 Shareable Permalinks**: Dedicated `/posts/:id` route with one-click clipboard copy.

### ⚡ Performance & Scalability
- **MongoDB Compound Indexes**: Optimized indexing on `{ createdAt: -1 }`, `{ tags: 1 }`, `{ authorId: 1 }`, and `{ recipientId: 1, read: 1 }`.
- **Infinite Scrolling**: `IntersectionObserver` sentinel that loads posts progressively as the user scrolls.
- **Cloud Media Pipeline**: Direct-to-cloud streaming via ImageKit SDK with client-side image validation.

---

## 🛠️ Technology Stack

```
SnapShare/
├── Frontend (Client)
│   ├── React 19 (Hooks, Context API)
│   ├── React Router DOM v7 (Declarative Client-side Routing)
│   ├── Axios (Configured client with JWT interceptors)
│   └── Vanilla CSS3 (Custom Properties design system, Glassmorphism)
└── Backend (Server)
    ├── Node.js (v22+) & Express 5
    ├── MongoDB Atlas & Mongoose ODM
    ├── ImageKit Node SDK (Cloud Media Storage)
    ├── JSON Web Tokens (JWT) & bcryptjs
    ├── Express Rate Limit & Multer
    └── Node Native Test Runner (node:test)
```

---

## 📁 Project Structure

```bash
Complete_Backend/
├── Backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── db.js                 # MongoDB connection handler
│   │   ├── middleware/
│   │   │   └── auth.middleware.js    # requireAuth & optionalAuth JWT guards
│   │   ├── models/
│   │   │   ├── user.model.js         # User schema with pre-save bcrypt hook
│   │   │   ├── post.model.js         # Post schema with indexes & view counts
│   │   │   ├── comment.model.js      # Comment schema with post references
│   │   │   └── notification.model.js # Notifications for likes and comments
│   │   ├── routes/
│   │   │   └── auth.routes.js        # Register, login, & /me endpoints
│   │   ├── services/
│   │   │   └── storage.service.js    # ImageKit upload stream integration
│   │   └── app.js                    # Express app configuration & all routes
│   ├── tests/
│   │   └── api.test.js               # 16 integration tests
│   ├── .env.example                  # Template for backend secrets
│   ├── package.json
│   └── server.js                     # HTTP server entrypoint
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Brand, search, notif dropdown, theme toggle
│   │   │   ├── Stories.jsx           # Stories bar with live backend fetch
│   │   │   ├── StoryViewer.jsx       # Modal story player with progress bars
│   │   │   ├── Footer.jsx            # App footer
│   │   │   ├── ScrollToTop.jsx       # Floating scroll-to-top button
│   │   │   └── ErrorBoundary.jsx     # Graceful error fallback
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # JWT user state, login, register, logout
│   │   │   └── ThemeContext.jsx      # Dark/light theme state & local persistence
│   │   ├── pages/
│   │   │   ├── Feed.jsx              # Main feed with infinite scroll, filters, & sidebar
│   │   │   ├── CreatePost.jsx        # Drag-and-drop upload & 9 filter presets
│   │   │   ├── PostDetail.jsx        # Shareable permalink page with full comments
│   │   │   ├── Profile.jsx           # User gallery, stats, and lightbox
│   │   │   ├── Login.jsx             # Glassmorphic sign-in page
│   │   │   ├── Register.jsx          # User registration with validation
│   │   │   └── NotFound.jsx          # Animated 404 page
│   │   ├── utils/
│   │   │   ├── api.js                # Centralized Axios instance
│   │   │   └── filters.js            # Shared CSS filter definitions
│   │   ├── App.jsx                   # Application router
│   │   ├── index.css                 # Comprehensive CSS design system
│   │   └── main.jsx
│   ├── .env.example                  # Template for frontend env vars
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/DevPranavJad700/snapshare-.git
cd snapshare-
```

### 2. Configure Backend
```bash
cd Backend
npm install
```

Create `.env` inside `Backend/`:
```env
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/snapshare
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
```

Start the backend:
```bash
npm run dev
# Server running → http://localhost:3000
```

### 3. Configure Frontend
```bash
cd ../Frontend
npm install
```

Create `.env` inside `Frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

Start the Vite development server:
```bash
npm run dev
# App running → http://localhost:5173
```

---

## 🧪 Running Automated Tests

SnapShare includes 16 integration tests verifying the full API pipeline:

```bash
cd Backend
npm test
```

```
TAP version 13
# Subtest: SnapShare API Test Suite
    ok 1 - GET /health returns 200 and status: ok
    ok 2 - POST /auth/register creates a new user account
    ok 3 - POST /auth/register rejects duplicate username
    ok 4 - POST /auth/login returns JWT token with valid credentials
    ok 5 - POST /auth/login rejects invalid password
    ok 6 - GET /auth/me returns authenticated user with valid token
    ok 7 - GET /posts returns list of posts and pagination metadata
    ok 8 - POST /create-post requires Authorization header
    ok 9 - GET /stories returns active story candidates
    ok 10 - GET /trending-tags returns array of tags
    ok 11 - GET /notifications returns 401 without auth
    ok 12 - GET /notifications returns user notifications with auth
    ok 13 - GET /posts/:id returns post and increments view count
    ok 14 - PATCH /posts/:id/like toggles post likes
    ok 15 - POST /posts/:id/comments and GET /posts/:id/comments
    ok 16 - PATCH /notifications/mark-read updates read status
1..16
# tests 16 | pass 16 | fail 0
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register a new creator account |
| `POST` | `/auth/login` | None | Authenticate credentials & receive JWT |
| `GET` | `/auth/me` | Bearer Token | Fetch authenticated user profile |
| `GET` | `/posts` | Optional | Get paginated posts with search & tag filters |
| `GET` | `/posts/:id` | Optional | Retrieve single post & increment view count |
| `POST` | `/create-post` | Bearer Token | Upload image via ImageKit and publish post |
| `PUT` | `/posts/:id` | Bearer Token (Author) | Edit post caption and tags |
| `DELETE` | `/posts/:id` | Bearer Token (Author) | Delete post and cascade delete comments |
| `PATCH` | `/posts/:id/like` | Optional | Like or unlike a post |
| `GET` | `/stories` | None | Fetch latest 48h creator stories |
| `GET` | `/posts/:id/comments` | None | Get comments list for a post |
| `POST` | `/posts/:id/comments` | Optional | Add a new comment to a post |
| `DELETE` | `/comments/:id` | Bearer Token (Author) | Delete comment |
| `GET` | `/notifications` | Bearer Token | Get user's activity notifications |
| `PATCH` | `/notifications/mark-read` | Bearer Token | Mark all user notifications as read |
| `GET` | `/trending-tags` | None | Get top trending hashtags |
| `GET` | `/health` | None | Service heartbeat and uptime check |

---

## 🛡️ Security Best Practices

- **Zero Secret Exposure**: `.env` files are excluded by `.gitignore`; `.env.example` templates provided.
- **Brute Force Protection**: Rate limiting applied to `/auth/*` endpoints (15 req / 15 min).
- **MIME & Size Validation**: Strict image-only upload validation with a 10MB threshold.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
