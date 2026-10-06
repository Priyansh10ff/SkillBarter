const mongoose = require("mongoose");
const { BOOKING_STATUS } = require("../config/constants");

const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema(
  {
    learner: { type: ObjectId, ref: "User", required: true },
    teacher: { type: ObjectId, ref: "User", required: true },
    listing: { type: ObjectId, ref: "Listing", required: true },
    // Copy of the listing at booking time, so later edits don't change past bookings
    listingSnapshot: {
      title: String,
      duration: Number,
      category: String,
    },
    creditCost: { type: Number, required: true, min: 0 },

    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.PENDING },

    // Open time proposal while PENDING
    proposal: {
      date: Date,
      by: { type: ObjectId, ref: "User" },
    },
    scheduledAt: Date,
    endsAt: Date,
    autoReleaseAt: Date,
    completedAt: Date,

    cancelledBy: { type: ObjectId, ref: "User" },
    cancelReason: { type: String, maxlength: 300 },

    dispute: {
      reason: { type: String, maxlength: 500 },
      openedAt: Date,
      resolvedAt: Date,
      outcome: { type: String, enum: ["release", "refund"] },
    },

    reviewedByLearner: { type: Boolean, default: false },
    reviewedByTeacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ learner: 1, status: 1 });
bookingSchema.index({ teacher: 1, status: 1 });
bookingSchema.index({ status: 1, autoReleaseAt: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
