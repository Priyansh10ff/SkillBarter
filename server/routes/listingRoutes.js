const express = require("express");
const c = require("../controllers/listingController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam } = require("../validators/common");
const v = require("../validators/listingValidators");

const router = express.Router();

router.get("/", c.getListings);
router.get("/my", protect, c.getMyListings);
router.get("/:id", validate({ params: idParam }), c.getListingById);
router.post("/", protect, validate({ body: v.createListing }), c.createListing);
router.delete("/:id", protect, validate({ params: idParam }), c.deleteListing);

module.exports = router;
