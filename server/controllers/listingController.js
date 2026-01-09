const Listing = require('../models/Listing');
const User = require('../models/User');

// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
const getListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate('teacher', 'name rating');
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private
const createListing = async (req, res) => {
  const { title, description, category, duration } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    const listing = await Listing.create({
      teacher: req.user.id,
      title,
      description,
      category,
      duration: duration || 60,
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get listings by current user
// @route   GET /api/listings/my
// @access  Private
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ teacher: req.user.id });
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check user ownership
    if (listing.teacher.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await listing.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getListings,
  createListing,
  getMyListings,
  deleteListing,
};