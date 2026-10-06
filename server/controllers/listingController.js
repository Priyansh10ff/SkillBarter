const Listing = require("../models/Listing");
const AppError = require("../utils/AppError");
const escapeRegex = require("../utils/escapeRegex");
const { suggestedListings, TEACHER_FIELDS } = require("../services/matchService");

// GET /api/listings?q=&category=&page=&limit=
const getListings = async (req, res) => {
  const { q, category, page, limit } = req.valid.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: re }, { description: re }, { tags: re }];
  }

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .populate("teacher", TEACHER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  res.json({ items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
};

// GET /api/listings/suggested
const getSuggested = async (req, res) => {
  res.json(await suggestedListings(req.user));
};

// GET /api/listings/my
const getMyListings = async (req, res) => {
  const listings = await Listing.find({ teacher: req.user._id, isActive: true }).sort({ createdAt: -1 });
  res.json(listings);
};

// GET /api/listings/:id → the listing, its teacher, and a few more by them
const getListingById = async (req, res) => {
  const listing = await Listing.findOne({ _id: req.valid.params.id, isActive: true }).populate(
    "teacher",
    `${TEACHER_FIELDS} bio preferredHours timezone stats`
  );
  if (!listing) throw new AppError(404, "Listing not found");

  const more = await Listing.find({ teacher: listing.teacher._id, isActive: true, _id: { $ne: listing._id } })
    .sort({ createdAt: -1 })
    .limit(3);

  res.json({ listing, more });
};

// POST /api/listings
const createListing = async (req, res) => {
  const listing = await Listing.create({ ...req.valid.body, teacher: req.user._id });
  res.status(201).json(listing);
};

const findOwned = async (id, userId) => {
  const listing = await Listing.findOne({ _id: id, isActive: true });
  if (!listing) throw new AppError(404, "Listing not found");
  if (String(listing.teacher) !== String(userId)) throw new AppError(403, "You can only change your own listings");
  return listing;
};

// PUT /api/listings/:id  (existing bookings keep their own snapshot)
const updateListing = async (req, res) => {
  const listing = await findOwned(req.valid.params.id, req.user._id);
  listing.set(req.valid.body);
  await listing.save();
  res.json(listing);
};

// DELETE /api/listings/:id  (soft delete: past bookings keep their reference)
const deleteListing = async (req, res) => {
  const listing = await findOwned(req.valid.params.id, req.user._id);
  listing.isActive = false;
  await listing.save();
  res.json({ id: listing._id });
};

module.exports = { getListings, getSuggested, getMyListings, getListingById, createListing, updateListing, deleteListing };
