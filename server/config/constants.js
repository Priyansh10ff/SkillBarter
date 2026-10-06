const BOOKING_STATUS = Object.freeze({
  PENDING: "PENDING", // waiting for both sides to agree on a time
  SCHEDULED: "SCHEDULED", // time agreed, credits held
  COMPLETED: "COMPLETED", // credits released to the teacher
  CANCELLED: "CANCELLED", // credits refunded to the learner
  DISPUTED: "DISPUTED", // learner reported a problem, credits frozen
});

const CREDIT_TYPES = Object.freeze({
  SIGNUP_BONUS: "SIGNUP_BONUS",
  BOOKING_HOLD: "BOOKING_HOLD",
  REFUND: "REFUND",
  SESSION_EARNING: "SESSION_EARNING",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
});

module.exports = {
  SIGNUP_BONUS: 2,
  AUTO_RELEASE_HOURS: 48,
  // Earliest a proposed time can be, and how far ahead it can go
  MIN_LEAD_MINUTES: 5,
  MAX_DAYS_AHEAD: 90,
  CATEGORIES: ["Coding", "Design", "Music", "Language", "Academics", "Career", "Lifestyle", "Other"],
  DURATIONS: [30, 60, 90, 120],
  BOOKING_STATUS,
  OPEN_STATUSES: [BOOKING_STATUS.PENDING, BOOKING_STATUS.SCHEDULED, BOOKING_STATUS.DISPUTED],
  CREDIT_TYPES,
};
