const User = require("../models/User");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const { BOOKING_STATUS: S } = require("../config/constants");

// Public numbers for the landing page, cached briefly
let cache = { at: 0, data: null };
const TTL_MS = 60 * 1000;

const getStats = async (req, res) => {
  if (cache.data && Date.now() - cache.at < TTL_MS) return res.json(cache.data);

  const [members, completed, openListings] = await Promise.all([
    User.countDocuments({ isVerified: true }),
    Booking.aggregate([{ $match: { status: S.COMPLETED } }, { $group: { _id: null, sessions: { $sum: 1 }, hours: { $sum: "$creditCost" } } }]),
    Listing.countDocuments({ isActive: true }),
  ]);

  const data = {
    members,
    sessionsCompleted: completed[0]?.sessions || 0,
    hoursExchanged: completed[0]?.hours || 0,
    openListings,
  };
  cache = { at: Date.now(), data };
  res.json(data);
};

// tests reset the cache between cases
const resetStatsCache = () => {
  cache = { at: 0, data: null };
};

module.exports = { getStats, resetStatsCache };
