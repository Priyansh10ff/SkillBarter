const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

const signToken = (userId) => jwt.sign({ id: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// One-time token for email links: the raw value goes in the email, only the hash is stored.
const createOneTimeToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
};

module.exports = { signToken, hashToken, createOneTimeToken };
