const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");

// GET /api/notifications → latest 30 + unread count
const list = async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.valid.params.id, user: req.user._id }, { read: true }, { returnDocument: "after" });
  if (!n) throw new AppError(404, "Notification not found");
  res.json(n);
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ unread: 0 });
};

module.exports = { list, markRead, markAllRead };
