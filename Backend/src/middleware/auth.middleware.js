const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "snapshare_dev_secret_change_in_prod";

/* Strict – 401 if no/invalid token */
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

/* Optional – attaches user if token valid, silently skips otherwise */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* ignore */ }
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
