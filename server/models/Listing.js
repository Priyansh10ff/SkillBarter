const mongoose = require("mongoose");
const { CATEGORIES, DURATIONS } = require("../config/constants");

const listingSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true },
    tags: { type: [String], default: [] },
    duration: { type: Number, enum: DURATIONS, default: 60 }, // minutes
    isActive: { type: Boolean, default: true }, // false = removed, can't be booked
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 1 credit = 1 hour
listingSchema.virtual("creditCost").get(function creditCost() {
  return this.duration / 60;
});

listingSchema.index({ title: "text", description: "text", tags: "text" });
listingSchema.index({ category: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Listing", listingSchema);
