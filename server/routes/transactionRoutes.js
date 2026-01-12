const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getMyTransactions 
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All transaction routes should be protected
router.post('/', protect, createTransaction);
router.get('/my', protect, getMyTransactions);

module.exports = router;