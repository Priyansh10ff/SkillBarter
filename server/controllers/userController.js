const bcrypt = require("bcryptjs");
const disposableDomains = require("disposable-email-domains");
const User = require("../models/User");
const CreditEntry = require("../models/CreditEntry");
const AppError = require("../utils/AppError");
const { signToken, hashToken, createOneTimeToken } = require("../utils/tokens");
const { runInTransaction, grantSignupBonus } = require("../services/creditService");
const { sendVerificationEmail } = require("../services/emailService");

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const disposable = new Set(disposableDomains);

// POST /api/users
const registerUser = async (req, res) => {
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

// POST /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Wrong email or password");
  }
  if (!user.isVerified) throw new AppError(403, "Verify your email before logging in");

  res.json({ token: signToken(user._id), user });
};

// GET /api/users/verify-email/:token
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

// GET /api/users/me
const getMe = (req, res) => {
  res.json(req.user);
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.valid.body, { returnDocument: "after", runValidators: true });
  res.json(user);
};

// GET /api/users/leaderboard
const getLeaderboard = async (req, res) => {
  const users = await User.find({ isVerified: true, "stats.classesTaught": { $gt: 0 } })
    .sort({ "stats.classesTaught": -1, rating: -1 })
    .limit(10)
    .select("name stats badges rating ratingCount");
  res.json(users);
};

module.exports = { registerUser, loginUser, verifyEmail, getMe, updateProfile, getLeaderboard };
