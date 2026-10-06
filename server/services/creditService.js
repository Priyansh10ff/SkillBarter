// The only code allowed to change User.timeCredits.
// Every change writes a CreditEntry in the same transaction.
const mongoose = require("mongoose");
const User = require("../models/User");
const CreditEntry = require("../models/CreditEntry");
const AppError = require("../utils/AppError");
const { SIGNUP_BONUS, CREDIT_TYPES, OPEN_STATUSES } = require("../config/constants");

// Runs fn(session) in a MongoDB transaction, retrying on transient conflicts.
// Needs a replica set (Atlas, or mongodb-memory-server in tests).
const runInTransaction = (fn) => mongoose.connection.transaction(fn);

/**
 * Adds `amount` (negative to take) to a user's balance and records it.
 * Taking credits fails with 400 if the balance would go below zero.
 */
const applyCredit = async ({ userId, amount, type, bookingId, note }, session) => {
  if (!session) throw new Error("applyCredit must run inside a transaction");

  const filter = { _id: userId };
  if (amount < 0) filter.timeCredits = { $gte: -amount };

  const user = await User.findOneAndUpdate(filter, { $inc: { timeCredits: amount } }, { returnDocument: "after", session });
  if (!user) {
    if (amount < 0) throw new AppError(400, "Not enough credits");
    throw new AppError(404, "User not found");
  }

  await CreditEntry.create(
    [{ user: userId, amount, type, booking: bookingId, balanceAfter: user.timeCredits, note }],
    { session }
  );
  return user;
};

const grantSignupBonus = (userId, session) =>
  applyCredit({ userId, amount: SIGNUP_BONUS, type: CREDIT_TYPES.SIGNUP_BONUS, note: "Welcome credits" }, session);

// Credits this user has paid into bookings that are still open
const getHeldCredits = async (userId) => {
  const Booking = mongoose.model("Booking");
  const [row] = await Booking.aggregate([
    { $match: { learner: new mongoose.Types.ObjectId(String(userId)), status: { $in: OPEN_STATUSES } } },
    { $group: { _id: null, total: { $sum: "$creditCost" } } },
  ]);
  return row?.total || 0;
};

module.exports = { runInTransaction, applyCredit, grantSignupBonus, getHeldCredits };
