const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    image:          { type: String, required: true },
    caption:        { type: String, default: "", maxlength: 200 },
    likes:          { type: Number, default: 0 },
    views:          { type: Number, default: 0 },
    tags:           [{ type: String, maxlength: 30 }],
    filter:         { type: String, default: "Normal" },
    authorId:       { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    authorUsername: { type: String, default: "snapshare_user" },
  },
  { timestamps: true }
);

/* ── MongoDB performance indexes ── */
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ caption: "text", tags: "text" }); // Full-text search

module.exports = mongoose.model("post", postSchema);
