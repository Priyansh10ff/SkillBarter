const jwt = require("jsonwebtoken");
const env = require("../config/env");

const signToken = (userId) => jwt.sign({ id: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

module.exports = { signToken };
