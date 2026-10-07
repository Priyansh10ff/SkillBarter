const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Listing = require("../models/Listing");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/tokens");
const { passwordChangedNow } = require("./authController");
const { barterMatches } = require("../services/matchService");

const PUBLIC_FIELDS = "name bio skillsOffered skillsRequested preferredHours timezone stats rating ratingCount badges createdAt";

// GET /api/users/me
const getMe = (req, res) => {
  res.json(req.user);
};

// PUT /api/users/me
const updateMe = async (req, res) => {
  const { onboarded, ...fields } = req.valid.body;
  const update = { ...fields };
  if (onboarded && !req.user.onboardedAt) update.onboardedAt = new Date();

  const user = await User.findByIdAndUpdate(req.user._id, update, { returnDocument: "after", runValidators: true });
  res.json(user);
};

// PUT /api/users/me/password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError(400, "Current password is wrong", [{ field: "currentPassword", message: "Current password is wrong" }]);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = passwordChangedNow();
  await user.save();

  // other sessions are logged out; this one gets a fresh token
  res.json({ message: "Password changed.", token: signToken(user._id) });
};

// GET /api/users/matches → members you could swap hours with
const getMatches = async (req, res) => {
  res.json(await barterMatches(req.user));
};

// GET /api/users/leaderboard?sort=taught|rated
// "rated" needs at least 3 reviews so one 5-star review can't top the board
const LEADERBOARDS = {
  taught: { filter: { "stats.classesTaught": { $gt: 0 } }, sort: { "stats.classesTaught": -1, rating: -1, createdAt: 1 } },
  rated: { filter: { ratingCount: { $gte: 3 } }, sort: { rating: -1, ratingCount: -1, createdAt: 1 } },
};

const getLeaderboard = async (req, res) => {
  const board = LEADERBOARDS[req.valid.query.sort];
  const users = await User.find(board.filter)
    .sort(board.sort)
    .limit(20)
    .select("name stats badges rating ratingCount");
  res.json(users);
};

// GET /api/users/:id  (public profile, no email)
const getPublicProfile = async (req, res) => {
  const user = await User.findById(req.valid.params.id).select(PUBLIC_FIELDS);
  if (!user) throw new AppError(404, "Member not found");

  const listings = await Listing.find({ teacher: user._id, isActive: true }).sort({ createdAt: -1 });
  res.json({ user, listings });
};

module.exports = { getMe, updateMe, changePassword, getMatches, getLeaderboard, getPublicProfile };
