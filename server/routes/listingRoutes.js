const express = require('express');
const router = express.Router();
const { getListings, createListing, getMyListings, deleteListing } = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getListings);
router.post('/', protect, createListing);
router.get('/my', protect, getMyListings);
router.delete('/:id', protect, deleteListing); // New Route

module.exports = router;