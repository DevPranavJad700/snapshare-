const express       = require("express");
const multer        = require("multer");
const rateLimit     = require("express-rate-limit");
const cors          = require("cors");
const uploadFile    = require("./services/storage.service");
const postModel     = require("./models/post.model");
const commentModel  = require("./models/comment.model");
const notifModel    = require("./models/notification.model");
const authRoutes    = require("./routes/auth.routes");
const { requireAuth, optionalAuth } = require("./middleware/auth.middleware");

const app = express();

/* ================================================================
   MIDDLEWARE
   ================================================================ */
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
}));

/* ── Rate Limiting ── */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  message: { message: "Too many auth attempts, try again in 15 minutes." },
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 30,
  message: { message: "Upload limit reached, try again in an hour." },
});

app.use(generalLimiter);

/* ── File upload ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files are allowed"), false),
});

/* ================================================================
   AUTH ROUTES
   ================================================================ */
app.use("/auth", authLimiter, authRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/", authRoutes);

/* ================================================================
   POSTS
   ================================================================ */

/* ── POST /create-post ── */
app.post("/create-post", requireAuth, uploadLimiter, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Image is required" });
  try {
    const result = await uploadFile(req.file.buffer);

    let tags = [];
    if (req.body.tags) {
      try { tags = JSON.parse(req.body.tags); }
      catch { tags = req.body.tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }

    const post = await postModel.create({
      image:          result.url,
      caption:        req.body.caption || "",
      tags:           tags.slice(0, 10),
      filter:         req.body.filter || "Normal",
      authorId:       req.user.id,
      authorUsername: req.user.username,
    });

    return res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create post", error: err.message });
  }
});

/* ── GET /posts  (search + tag filter + pagination) ── */
app.get("/posts", optionalAuth, async (req, res) => {
  try {
    const { search, tag, page = 1, limit = 12, author } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: "i" } },
        { tags:    { $regex: search, $options: "i" } },
      ];
    }
    if (tag)    query.tags = { $regex: `^${tag}$`, $options: "i" };
    if (author) query.authorId = author;

    const skip       = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      postModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      postModel.countDocuments(query),
    ]);

    return res.status(200).json({
      posts, total, page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});

/* ── GET /posts/:id  (single post + increment views) ── */
app.get("/posts/:id", optionalAuth, async (req, res) => {
  try {
    const post = await postModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.status(200).json({ post });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch post", error: err.message });
  }
});

/* ── PUT /posts/:id  (edit — owner only) ── */
app.put("/posts/:id", requireAuth, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId?.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only edit your own posts." });

    let tags = post.tags;
    if (req.body.tags) {
      try { tags = JSON.parse(req.body.tags); }
      catch { tags = req.body.tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }

    post.caption = req.body.caption ?? post.caption;
    post.tags    = tags;
    await post.save();

    return res.status(200).json({ post });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update post", error: err.message });
  }
});

/* ── DELETE /posts/:id ── */
app.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only owner can delete (skip check for legacy posts with no authorId)
    if (post.authorId && post.authorId.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only delete your own posts." });

    await post.deleteOne();
    await commentModel.deleteMany({ postId: req.params.id });
    await notifModel.deleteMany({ postId: req.params.id });

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
});

/* ── PATCH /posts/:id/like  { action: "like" | "unlike" } ── */
app.patch("/posts/:id/like", optionalAuth, async (req, res) => {
  try {
    const inc  = req.body.action === "unlike" ? -1 : 1;
    const post = await postModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: inc } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Create notification when liking (not when unliking)
    if (inc === 1 && req.user && post.authorId && post.authorId.toString() !== req.user.id) {
      notifModel.create({
        recipientId:    post.authorId,
        senderId:       req.user.id,
        senderUsername: req.user.username,
        type:    "like",
        postId:  post._id,
        postImage: post.image,
      }).catch(() => {}); // fire-and-forget
    }

    return res.status(200).json({ likes: Math.max(0, post.likes) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update like", error: err.message });
  }
});

/* ── GET /stories  (latest post per unique author, last 48h) ── */
app.get("/stories", async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const posts = await postModel
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(50);

    // One story per authorId/authorUsername
    const seen   = new Set();
    const stories = [];
    for (const p of posts) {
      const key = p.authorId?.toString() || p.authorUsername;
      if (!seen.has(key)) { seen.add(key); stories.push(p); }
      if (stories.length >= 10) break;
    }
    return res.status(200).json({ stories });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stories", error: err.message });
  }
});

/* ================================================================
   COMMENTS
   ================================================================ */

/* ── GET /posts/:id/comments ── */
app.get("/posts/:id/comments", async (req, res) => {
  try {
    const comments = await commentModel
      .find({ postId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ comments });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch comments", error: err.message });
  }
});

/* ── POST /posts/:id/comments  { username?, text } ── */
app.post("/posts/:id/comments", optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });

    const authorUsername = req.user?.username || req.body.username?.trim() || "Anonymous";

    const comment = await commentModel.create({
      postId:   req.params.id,
      username: authorUsername,
      authorId: req.user?.id || undefined,
      text:     text.trim(),
    });

    // Notify post owner
    const post = await postModel.findById(req.params.id).select("authorId image");
    if (post?.authorId && req.user && post.authorId.toString() !== req.user.id) {
      notifModel.create({
        recipientId:    post.authorId,
        senderId:       req.user.id,
        senderUsername: req.user.username,
        type:        "comment",
        postId:      req.params.id,
        postImage:   post.image,
        commentText: text.trim().substring(0, 60),
      }).catch(() => {});
    }

    return res.status(201).json({ comment });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
});

/* ── DELETE /comments/:id ── */
app.delete("/comments/:id", requireAuth, async (req, res) => {
  try {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.authorId && comment.authorId.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only delete your own comments." });
    await comment.deleteOne();
    return res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete comment", error: err.message });
  }
});

/* ================================================================
   NOTIFICATIONS
   ================================================================ */

/* ── GET /notifications ── */
app.get("/notifications", requireAuth, async (req, res) => {
  try {
    const notifs = await notifModel
      .find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    const unread = await notifModel.countDocuments({ recipientId: req.user.id, read: false });
    return res.status(200).json({ notifications: notifs, unread });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ── PATCH /notifications/mark-read ── */
app.patch("/notifications/mark-read", requireAuth, async (req, res) => {
  try {
    await notifModel.updateMany({ recipientId: req.user.id, read: false }, { $set: { read: true } });
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ================================================================
   TRENDING TAGS + HEALTH
   ================================================================ */
app.get("/trending-tags", async (req, res) => {
  try {
    const posts = await postModel.find({ tags: { $exists: true, $ne: [] } }, { tags: 1 });
    const tagCount = {};
    posts.forEach((p) => p.tags.forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const trending = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }));
    return res.status(200).json({ trending });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: err.message || "Internal server error" });
});

module.exports = app;
