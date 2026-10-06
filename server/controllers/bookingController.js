const bookingService = require("../services/bookingService");

const userId = (req) => req.user._id;

const create = async (req, res) => {
  const { listingId, proposedDate } = req.valid.body;
  const booking = await bookingService.create({ learner: req.user, listingId, proposedDate });
  res.status(201).json(booking);
};

const list = async (req, res) => {
  res.json(await bookingService.listForUser({ userId: userId(req), ...req.valid.query }));
};

const getOne = async (req, res) => {
  res.json(await bookingService.getById(req.valid.params.id, userId(req)));
};

const propose = async (req, res) => {
  res.json(await bookingService.propose({ bookingId: req.valid.params.id, userId: userId(req), date: req.valid.body.date }));
};

const accept = async (req, res) => {
  res.json(await bookingService.accept({ bookingId: req.valid.params.id, userId: userId(req) }));
};

const cancel = async (req, res) => {
  res.json(await bookingService.cancel({ bookingId: req.valid.params.id, userId: userId(req), reason: req.valid.body.reason }));
};

const complete = async (req, res) => {
  res.json(await bookingService.complete({ bookingId: req.valid.params.id, userId: userId(req) }));
};

const dispute = async (req, res) => {
  res.json(await bookingService.dispute({ bookingId: req.valid.params.id, userId: userId(req), reason: req.valid.body.reason }));
};

const listMessages = async (req, res) => {
  res.json(await bookingService.listMessages({ bookingId: req.valid.params.id, userId: userId(req) }));
};

const postMessage = async (req, res) => {
  res.status(201).json(await bookingService.postMessage({ bookingId: req.valid.params.id, userId: userId(req), body: req.valid.body.body }));
};

module.exports = { create, list, getOne, propose, accept, cancel, complete, dispute, listMessages, postMessage };
