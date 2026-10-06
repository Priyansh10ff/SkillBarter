const CreditEntry = require("../models/CreditEntry");
const { getHeldCredits } = require("../services/creditService");

// GET /api/wallet?page=&limit=
const getWallet = async (req, res) => {
  const { page, limit } = req.valid.query;
  const filter = { user: req.user._id };

  const [entries, total, held, history] = await Promise.all([
    CreditEntry.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("booking", "listingSnapshot.title status"),
    CreditEntry.countDocuments(filter),
    getHeldCredits(req.user._id),
    // last 100 movements, oldest first, for the balance chart
    CreditEntry.find(filter).sort({ createdAt: -1, _id: -1 }).limit(100).select("createdAt amount balanceAfter type").lean(),
  ]);

  res.json({
    balance: req.user.timeCredits,
    held,
    entries,
    history: history.reverse(),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
};

module.exports = { getWallet };
