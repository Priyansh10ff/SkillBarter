const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    // New Scheduling Fields
    appointmentStatus: {
      type: String,
      enum: ["UNSCHEDULED", "PROPOSED", "SCHEDULED", "REJECTED"],
      default: "UNSCHEDULED",
    },
    scheduledDate: { type: Date },
    proposedDate: { type: Date },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
