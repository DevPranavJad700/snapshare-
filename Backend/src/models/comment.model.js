const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId:         { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
    username:       { type: String, default: "Anonymous", maxlength: 50 },
    authorId:       { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    text:           { type: String, required: true, maxlength: 300 },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model("comment", commentSchema);
