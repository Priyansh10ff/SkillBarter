const CreditEntry = require("../models/CreditEntry");
const { getHeldCredits } = require("../services/creditService");

// GET /api/wallet?page=&limit=
const getWallet = async (req, res) => {
  const { page, limit } = req.valid.query;
  const filter = { user: req.user._id };

  const [entries, total, held] = await Promise.all([
    CreditEntry.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("booking", "listingSnapshot.title status"),
    CreditEntry.countDocuments(filter),
    getHeldCredits(req.user._id),
  ]);

  res.json({
    balance: req.user.timeCredits,
    held,
    entries,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
};

module.exports = { getWallet };
