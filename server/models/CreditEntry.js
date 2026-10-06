const mongoose = require("mongoose");
const { CREDIT_TYPES } = require("../config/constants");

// Append-only ledger. For every user, the sum of their entries equals User.timeCredits.
const creditEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // positive = in, negative = out
    type: { type: String, enum: Object.values(CREDIT_TYPES), required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    balanceAfter: { type: Number, required: true },
    note: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

creditEntrySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("CreditEntry", creditEntrySchema);
