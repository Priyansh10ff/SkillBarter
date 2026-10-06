const mongoose = require("mongoose");

// Chat between the learner and teacher of one booking
const messageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ booking: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
