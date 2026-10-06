const express = require("express");
const c = require("../controllers/authController");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimit");
const v = require("../validators/authValidators");

const router = express.Router();
router.use(authLimiter);

router.post("/register", validate({ body: v.register }), c.register);
router.post("/login", validate({ body: v.login }), c.login);
router.get("/verify-email/:token", validate({ params: v.tokenParam }), c.verifyEmail);
router.post("/resend-verification", validate({ body: v.emailOnly }), c.resendVerification);
router.post("/forgot-password", validate({ body: v.emailOnly }), c.forgotPassword);
router.post("/reset-password/:token", validate({ params: v.tokenParam, body: v.resetPassword }), c.resetPassword);

module.exports = router;
