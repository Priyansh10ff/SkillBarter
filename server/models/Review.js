const mongoose = require("mongoose");

// One review per participant per completed booking
const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["learner", "teacher"], required: true }, // the author's role
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ booking: 1, author: 1 }, { unique: true });
reviewSchema.index({ subject: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
