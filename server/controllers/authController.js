const bcrypt = require("bcryptjs");
const disposableDomains = require("disposable-email-domains");
const User = require("../models/User");
const CreditEntry = require("../models/CreditEntry");
const AppError = require("../utils/AppError");
const { signToken, hashToken, createOneTimeToken } = require("../utils/tokens");
const { runInTransaction, grantSignupBonus } = require("../services/creditService");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/emailService");

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const disposable = new Set(disposableDomains);

// Same answer whether or not the email exists, so accounts can't be discovered
const NEUTRAL = "If that email has an account, we've sent a link to it.";

// Slightly in the past so a token issued right after still passes the iat check
const passwordChangedNow = () => new Date(Date.now() - 1000);

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, skills = [] } = req.valid.body;

  if (disposable.has(email.split("@")[1])) throw new AppError(400, "Disposable email addresses are not allowed");
  if (await User.exists({ email })) throw new AppError(409, "An account with this email already exists");

  const { raw, hash } = createOneTimeToken();
  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  await runInTransaction(async (session) => {
    [user] = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          skillsOffered: skills,
          verificationToken: hash,
          verificationExpires: new Date(Date.now() + VERIFY_TTL_MS),
        },
      ],
      { session }
    );
    await grantSignupBonus(user._id, session);
  });

  try {
    await sendVerificationEmail(user, raw);
  } catch (error) {
    console.error("Verification email failed:", error);
    await Promise.all([User.deleteOne({ _id: user._id }), CreditEntry.deleteMany({ user: user._id })]);
    throw new AppError(502, "We couldn't send the verification email. Please try again.");
  }

  res.status(201).json({ message: "Account created. Check your email to verify it." });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Wrong email or password");
  }
  // code lets the client offer "resend verification email"
  if (!user.isVerified) {
    const error = new AppError(403, "Verify your email before logging in");
    error.code = "EMAIL_UNVERIFIED";
    throw error;
  }

  res.json({ token: signToken(user._id), user });
};

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  const user = await User.findOne({
    verificationToken: hashToken(req.valid.params.token),
    verificationExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError(400, "This link is invalid or has expired");

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  res.json({ message: "Email verified.", token: signToken(user._id), user });
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  const user = await User.findOne({ email: req.valid.body.email });
  if (user && !user.isVerified) {
    const { raw, hash } = createOneTimeToken();
    user.verificationToken = hash;
    user.verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await user.save();
    await sendVerificationEmail(user, raw);
  }
  res.json({ message: NEUTRAL });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.valid.body.email });
  if (user) {
    const { raw, hash } = createOneTimeToken();
    user.resetToken = hash;
    user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();
    await sendPasswordResetEmail(user, raw);
  }
  res.json({ message: NEUTRAL });
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: hashToken(req.valid.params.token),
    resetExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError(400, "This link is invalid or has expired");

  user.password = await bcrypt.hash(req.valid.body.password, 10);
  user.passwordChangedAt = passwordChangedNow();
  user.resetToken = undefined;
  user.resetExpires = undefined;
  // receiving the email proves they own the address
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  res.json({ message: "Password updated.", token: signToken(user._id), user });
};

module.exports = { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword, passwordChangedNow };
