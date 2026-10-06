const express = require("express");
const c = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam } = require("../validators/common");
const v = require("../validators/bookingValidators");

const router = express.Router();
router.use(protect);

router.post("/", validate({ body: v.createBooking }), c.create);
router.get("/", validate({ query: v.listQuery }), c.list);
router.get("/:id", validate({ params: idParam }), c.getOne);
router.post("/:id/propose", validate({ params: idParam, body: v.propose }), c.propose);
router.post("/:id/accept", validate({ params: idParam }), c.accept);
router.post("/:id/cancel", validate({ params: idParam, body: v.cancel }), c.cancel);
router.post("/:id/complete", validate({ params: idParam }), c.complete);
router.post("/:id/dispute", validate({ params: idParam, body: v.dispute }), c.dispute);
router.get("/:id/messages", validate({ params: idParam }), c.listMessages);
router.post("/:id/messages", validate({ params: idParam, body: v.message }), c.postMessage);

module.exports = router;
