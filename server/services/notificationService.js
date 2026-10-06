// Saves a notification, pushes it live, and optionally emails it.
// Never throws: a failed notification must not undo a booking that already committed.
const env = require("../config/env");
const Notification = require("../models/Notification");
const { emitToUser } = require("./realtime");
const { sendMail } = require("./emailService");
const escapeHtml = require("../utils/escapeHtml");

const sendNotificationEmail = (user, { subject, message, link }) => {
  const url = `${env.CLIENT_URL}${link || "/bookings"}`;
  return sendMail({
    to: user.email,
    subject: `${subject} - Skill Barter`,
    text: `Hi ${user.name},\n\n${message}\n\n${url}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>${escapeHtml(message)}</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Open Skill Barter</a></p>
      </div>`,
  });
};

/**
 * notify(user, { type, message, link, email: "Subject line" | undefined })
 * `user` needs _id, plus name and email when emailing.
 */
const notify = async (user, { type, message, link, email }) => {
  try {
    const notification = await Notification.create({ user: user._id, type, message, link });
    emitToUser(user._id, "notification", notification);
    if (email) await sendNotificationEmail(user, { subject: email, message, link });
    return notification;
  } catch (error) {
    console.error(`Notification ${type} for ${user._id} failed:`, error);
    return null;
  }
};

module.exports = { notify };
