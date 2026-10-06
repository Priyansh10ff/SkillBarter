const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 60 },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    bio: { type: String, default: "", maxlength: 500 },
    skillsOffered: { type: [String], default: [] },
    skillsRequested: { type: [String], default: [] },
    preferredHours: { type: String, default: "", maxlength: 100 },
    timezone: { type: String, default: "UTC" },

    // Available balance. Only creditService changes this, and every change
    // has a matching CreditEntry, so the ledger always adds up to this number.
    timeCredits: { type: Number, default: 0, min: 0 },

    stats: {
      classesTaught: { type: Number, default: 0 },
      classesAttended: { type: Number, default: 0 },
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    badges: [
      {
        code: String, // stable id, e.g. taught-5
        name: String, // shown as a stamp, e.g. "Taught ×5"
        dateEarned: { type: Date, default: Date.now },
      },
    ],

    // Set when the user finishes the setup steps after verifying
    onboardedAt: Date,

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    // Tokens issued before this are rejected (password change / reset logs out other sessions)
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationExpires;
    delete ret.resetToken;
    delete ret.resetExpires;
    delete ret.passwordChangedAt;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
