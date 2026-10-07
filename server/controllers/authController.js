const bcrypt = require("bcryptjs");
const disposableDomains = require("disposable-email-domains");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/tokens");
const { runInTransaction, grantSignupBonus } = require("../services/creditService");

const disposable = new Set(disposableDomains);

// Slightly in the past so a token issued right after still passes the iat check
const passwordChangedNow = () => new Date(Date.now() - 1000);

// POST /api/auth/register → creates the account and logs it in
const register = async (req, res) => {
  const { name, email, password, skills = [] } = req.valid.body;

  if (disposable.has(email.split("@")[1])) throw new AppError(400, "Disposable email addresses are not allowed");
  if (await User.exists({ email })) throw new AppError(409, "An account with this email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  await runInTransaction(async (session) => {
    [user] = await User.create([{ name, email, password: hashedPassword, skillsOffered: skills }], { session });
    await grantSignupBonus(user._id, session);
  });

  res.status(201).json({ token: signToken(user._id), user: await User.findById(user._id) });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Wrong email or password");
  }

  res.json({ token: signToken(user._id), user });
};

module.exports = { register, login, passwordChangedNow };
