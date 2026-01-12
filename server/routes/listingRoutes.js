const express = require("express");
const router = express.Router();
const {
  getListings,
  createListing,
  getListingById,
  deleteListing,
} = require("../controllers/listingController");
const { protect } = require("../middleware/authMiddleware");

// Public route to see all listings
router.get("/", getListings);

// Protected routes (must be logged in)
router.post("/", protect, createListing);
router.get("/:id", getListingById);
router.delete("/:id", protect, deleteListing);

module.exports = router;
