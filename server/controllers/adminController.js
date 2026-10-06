const bookingService = require("../services/bookingService");

const listDisputes = async (req, res) => {
  res.json(await bookingService.listDisputes());
};

const resolveDispute = async (req, res) => {
  res.json(await bookingService.resolveDispute({ bookingId: req.valid.params.id, outcome: req.valid.body.outcome }));
};

module.exports = { listDisputes, resolveDispute };
