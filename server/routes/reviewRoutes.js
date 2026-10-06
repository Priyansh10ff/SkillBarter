const express = require("express");
const c = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam } = require("../validators/common");
const v = require("../validators/reviewValidators");

const router = express.Router();

router.post("/", protect, validate({ body: v.createReview }), c.create);
router.get("/user/:id", validate({ params: idParam }), c.forUser);

module.exports = router;
