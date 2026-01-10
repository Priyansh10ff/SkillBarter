const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true }, // e.g., "Learn React Basics"
    description: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, default: 60 }, // in minutes, usually 60 mins = 1 Credit
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
