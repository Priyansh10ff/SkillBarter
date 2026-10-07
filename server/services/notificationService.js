// Saves a notification and pushes it live.
// Never throws: a failed notification must not undo a booking that already committed.
const Notification = require("../models/Notification");
const { emitToUser } = require("./realtime");

/**
 * notify(user, { type, message, link })
 * `user` needs _id.
 */
const notify = async (user, { type, message, link }) => {
  try {
    const notification = await Notification.create({ user: user._id, type, message, link });
    emitToUser(user._id, "notification", notification);
    return notification;
  } catch (error) {
    console.error(`Notification ${type} for ${user._id} failed:`, error);
    return null;
  }
};

module.exports = { notify };
