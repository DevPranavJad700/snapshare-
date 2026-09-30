const express  = require("express");
const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const userModel = require("../models/user.model");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
const SECRET  = process.env.JWT_SECRET || "snapshare_dev_secret_change_in_prod";
const EXPIRES = "7d";

const sign = (user) =>
  jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: EXPIRES });

const safeUser = (u) => ({ id: u._id, username: u.username, bio: u.bio, createdAt: u.createdAt });

/* POST /register */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password)
      return res.status(400).json({ message: "Username and password are required." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const exists = await userModel.findOne({ username: username.trim() });
    if (exists) return res.status(409).json({ message: "Username already taken. Choose another." });

    const user  = await userModel.create({ username: username.trim(), password });
    const token = sign(user);

    return res.status(201).json({ message: "Account created!", token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

/* POST /login */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password are required." });

    const user = await userModel.findOne({ username: username.trim() });
    if (!user) return res.status(401).json({ message: "Invalid username or password." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid username or password." });

    const token = sign(user);
    return res.status(200).json({ message: "Welcome back!", token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

/* GET /me */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
