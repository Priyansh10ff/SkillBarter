// Shared test setup: in-memory MongoDB replica set (needed for transactions),
// the Express app, and helpers for users, listings and ledger checks.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough";
process.env.MONGO_URI = "mongodb://set-at-runtime";
process.env.CLIENT_URL = "http://localhost:5173";

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const app = require("../app");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const CreditEntry = require("../models/CreditEntry");
const { runInTransaction, grantSignupBonus } = require("../services/creditService");
const { signToken } = require("../utils/tokens");
const { SIGNUP_BONUS, OPEN_STATUSES } = require("../config/constants");

let replSet;

const startDb = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(replSet.getUri());
  // create collections + indexes up front; transactions can't build indexes
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
};

const stopDb = async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
};

const clearDb = () => Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));

let counter = 0;
const createUser = async ({ name, role = "user" } = {}) => {
  counter += 1;
  const user = await User.create({
    name: name || `User ${counter}`,
    email: `user${counter}@example.com`,
    password: await bcrypt.hash("password123", 4),
    role,
  });
  await runInTransaction((session) => grantSignupBonus(user._id, session));
  const token = signToken(user._id);
  return { user: await User.findById(user._id), token, auth: { Authorization: `Bearer ${token}` } };
};

const createListing = (teacherId, overrides = {}) =>
  Listing.create({
    teacher: teacherId,
    title: "Intro to React",
    description: "Components, props, state and hooks.",
    category: "Coding",
    duration: 60,
    ...overrides,
  });

const balanceOf = async (userId) => (await User.findById(userId)).timeCredits;

// Moves a booking's schedule so the session started `minutesAgo` minutes ago.
const startSessionAgo = async (bookingId, minutesAgo = 5, { releaseInHours = 48 } = {}) => {
  const scheduledAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  await Booking.updateOne(
    { _id: bookingId },
    {
      scheduledAt,
      endsAt: new Date(scheduledAt.getTime() + 60 * 60 * 1000),
      autoReleaseAt: new Date(Date.now() + releaseInHours * 60 * 60 * 1000),
    }
  );
};

// Ledger invariants that must hold after any sequence of operations:
// 1. every user's entries sum to their balance
// 2. no balance is negative
// 3. balances + credits held in open bookings == credits ever granted
const assertLedgerConsistent = async () => {
  const users = await User.find();
  for (const user of users) {
    const [row] = await CreditEntry.aggregate([{ $match: { user: user._id } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]);
    assert.equal(row?.sum || 0, user.timeCredits, `ledger sum != balance for ${user.email}`);
    assert.ok(user.timeCredits >= 0, `negative balance for ${user.email}`);
  }

  const totalBalance = users.reduce((sum, u) => sum + u.timeCredits, 0);
  const [held] = await Booking.aggregate([
    { $match: { status: { $in: OPEN_STATUSES } } },
    { $group: { _id: null, sum: { $sum: "$creditCost" } } },
  ]);
  assert.equal(totalBalance + (held?.sum || 0), users.length * SIGNUP_BONUS, "credits were created or destroyed");
};

module.exports = {
  app,
  startDb,
  stopDb,
  clearDb,
  createUser,
  createListing,
  balanceOf,
  startSessionAgo,
  assertLedgerConsistent,
  models: { User, Listing, Booking, CreditEntry },
};
