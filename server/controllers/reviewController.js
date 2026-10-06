const reviewService = require("../services/reviewService");

// POST /api/reviews
const create = async (req, res) => {
  const { bookingId, rating, comment } = req.valid.body;
  res.status(201).json(await reviewService.create({ bookingId, authorId: req.user._id, rating, comment }));
};

// GET /api/reviews/user/:id
const forUser = async (req, res) => {
  res.json(await reviewService.forUser(req.valid.params.id));
};

module.exports = { create, forUser };
