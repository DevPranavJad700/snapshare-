const mongoose = require("mongoose");

const notifSchema = new mongoose.Schema(
  {
    recipientId:    { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    senderId:       { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    senderUsername: { type: String, default: "Someone" },
    type:           { type: String, enum: ["like", "comment"], required: true },
    postId:         { type: mongoose.Schema.Types.ObjectId, ref: "post" },
    postImage:      { type: String },
    commentText:    { type: String },
    read:           { type: Boolean, default: false },
  },
  { timestamps: true }
);

notifSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("notification", notifSchema);
