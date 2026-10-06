const express = require("express");
const c = require("../controllers/adminController");
const { protect, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam } = require("../validators/common");
const { resolve } = require("../validators/bookingValidators");

const router = express.Router();
router.use(protect, requireAdmin);

router.get("/disputes", c.listDisputes);
router.post("/disputes/:id/resolve", validate({ params: idParam, body: resolve }), c.resolveDispute);

module.exports = router;
