const express = require("express");
const c = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimit");
const v = require("../validators/userValidators");

const router = express.Router();

router.post("/", authLimiter, validate({ body: v.register }), c.registerUser);
router.post("/login", authLimiter, validate({ body: v.login }), c.loginUser);
router.get("/verify-email/:token", authLimiter, validate({ params: v.tokenParam }), c.verifyEmail);
router.get("/leaderboard", c.getLeaderboard);
router.get("/me", protect, c.getMe);
router.put("/profile", protect, validate({ body: v.profile }), c.updateProfile);

module.exports = router;
