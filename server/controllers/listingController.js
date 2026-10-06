const Listing = require("../models/Listing");
const AppError = require("../utils/AppError");

// GET /api/listings
const getListings = async (req, res) => {
  const listings = await Listing.find({ isActive: true }).populate("teacher", "name rating").sort({ createdAt: -1 });
  res.json(listings);
};

// GET /api/listings/my
const getMyListings = async (req, res) => {
  const listings = await Listing.find({ teacher: req.user._id, isActive: true }).sort({ createdAt: -1 });
  res.json(listings);
};

// GET /api/listings/:id
const getListingById = async (req, res) => {
  const listing = await Listing.findOne({ _id: req.valid.params.id, isActive: true }).populate("teacher", "name rating");
  if (!listing) throw new AppError(404, "Listing not found");
  res.json(listing);
};

// POST /api/listings
const createListing = async (req, res) => {
  const listing = await Listing.create({ ...req.valid.body, teacher: req.user._id });
  res.status(201).json(listing);
};

// DELETE /api/listings/:id  (soft delete: past bookings keep their reference)
const deleteListing = async (req, res) => {
  const listing = await Listing.findOne({ _id: req.valid.params.id, isActive: true });
  if (!listing) throw new AppError(404, "Listing not found");
  if (String(listing.teacher) !== String(req.user._id)) throw new AppError(403, "You can only remove your own listings");

  listing.isActive = false;
  await listing.save();
  res.json({ id: listing._id });
};

module.exports = { getListings, getMyListings, getListingById, createListing, deleteListing };
