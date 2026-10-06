const express = require("express");
const c = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimit");
const { idParam } = require("../validators/common");
const v = require("../validators/userValidators");

const router = express.Router();

// fixed paths before /:id
router.get("/leaderboard", c.getLeaderboard);
router.get("/me", protect, c.getMe);
router.get("/matches", protect, c.getMatches);
router.put("/me", protect, validate({ body: v.profile }), c.updateMe);
router.put("/me/password", protect, authLimiter, validate({ body: v.changePassword }), c.changePassword);
router.get("/:id", validate({ params: idParam }), c.getPublicProfile);

module.exports = router;
