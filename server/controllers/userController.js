const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const disposableDomains = require('disposable-email-domains');
const User = require('../models/User');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if email domain is disposable/fake
const isFakeEmail = (email) => {
  const domain = email.split('@')[1];
  return disposableDomains.includes(domain);
};

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Skill Barter',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to Skill Barter, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create this account, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check for fake/disposable email
  if (isFakeEmail(email)) {
    return res.status(400).json({ message: 'Disposable email addresses are not allowed' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken: hashedToken,
  });

  if (user) {
    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Check if email is verified
    // We only block if they have a verification token (new users) and are not verified
    // This allows existing users (who have no token) to continue logging in
    if (user.verificationToken && !user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email to login' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.preferredHours) {
      user.preferredHours = req.body.preferredHours;
    }
    // Add other fields to update as needed

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ 'stats.classesTaught': -1 })
      .limit(10)
      .select('name stats badges');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching verification token
    const user = await User.findOne({ verificationToken: hashedToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified. Please login.' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully! You can now login.',
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getLeaderboard,
  verifyEmail,
};