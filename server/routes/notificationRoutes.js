const express = require("express");
const c = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam } = require("../validators/common");

const router = express.Router();
router.use(protect);

router.get("/", c.list);
router.put("/read-all", c.markAllRead);
router.put("/:id/read", validate({ params: idParam }), c.markRead);

module.exports = router;
