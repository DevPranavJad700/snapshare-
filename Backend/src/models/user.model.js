const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, required: true, unique: true,
      trim: true, minlength: 3, maxlength: 30,
    },
    password: { type: String, required: true, minlength: 6 },
    bio:      { type: String, default: "", maxlength: 150 },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("user", userSchema);
