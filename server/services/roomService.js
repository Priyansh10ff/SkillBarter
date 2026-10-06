// Who may enter a session room, when, and with which video peer IDs.
const crypto = require("crypto");
const env = require("../config/env");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const { BOOKING_STATUS: S, ROOM_OPENS_MINUTES_BEFORE, ROOM_CLOSES_HOURS_AFTER } = require("../config/constants");

const MINUTE = 60 * 1000;

// Unguessable but stable peer IDs, so nobody can squat or call into a room
// by predicting "<bookingId>-teacher".
const peerIdFor = (bookingId, role) => {
  const sig = crypto.createHmac("sha256", env.JWT_SECRET).update(`${bookingId}:${role}`).digest("hex").slice(0, 20);
  return `${bookingId}-${role}-${sig}`;
};

const iceServers = () => {
  const servers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  if (env.TURN_URL) servers.push({ urls: env.TURN_URL, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
  return servers;
};

const windowFor = (booking) => ({
  opensAt: new Date(booking.scheduledAt.getTime() - ROOM_OPENS_MINUTES_BEFORE * MINUTE),
  closesAt: new Date(booking.endsAt.getTime() + ROOM_CLOSES_HOURS_AFTER * 60 * MINUTE),
});

/**
 * Checks the user can be in this booking's room right now.
 * Returns { booking, role } or throws with a reason the room page can show.
 */
const checkAccess = async (bookingId, userId, now = new Date()) => {
  const booking = await Booking.findById(bookingId).populate("learner", "name").populate("teacher", "name");
  const isLearner = booking && String(booking.learner._id) === String(userId);
  const isTeacher = booking && String(booking.teacher._id) === String(userId);
  if (!booking || !(isLearner || isTeacher)) throw new AppError(404, "Booking not found");

  if (booking.status !== S.SCHEDULED) {
    const error = new AppError(400, "This session isn't scheduled, so its room is closed.");
    error.code = "ROOM_NOT_SCHEDULED";
    throw error;
  }
  const { opensAt, closesAt } = windowFor(booking);
  if (now < opensAt) {
    const error = new AppError(400, `The room opens ${ROOM_OPENS_MINUTES_BEFORE} minutes before the session.`, [{ field: "opensAt", message: opensAt.toISOString() }]);
    error.code = "ROOM_NOT_OPEN";
    throw error;
  }
  if (now > closesAt) {
    const error = new AppError(400, "This session's room has closed.");
    error.code = "ROOM_CLOSED";
    throw error;
  }
  return { booking, role: isLearner ? "learner" : "teacher" };
};

// GET /api/bookings/:id/room payload
const roomInfo = async (bookingId, userId) => {
  const { booking, role } = await checkAccess(bookingId, userId);
  const otherRole = role === "learner" ? "teacher" : "learner";
  return {
    bookingId: String(booking._id),
    title: booking.listingSnapshot.title,
    durationMinutes: booking.listingSnapshot.duration,
    scheduledAt: booking.scheduledAt,
    endsAt: booking.endsAt,
    role,
    me: { name: booking[role].name, peerId: peerIdFor(booking._id, role) },
    other: { name: booking[otherRole].name, peerId: peerIdFor(booking._id, otherRole) },
    iceServers: iceServers(),
  };
};

module.exports = { checkAccess, roomInfo, peerIdFor };
