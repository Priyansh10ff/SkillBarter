const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getMyTransactions, 
  completeTransaction, 
  updateSchedule 
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, createTransaction);
router.get('/my', protect, getMyTransactions);
router.put('/:id/complete', protect, completeTransaction);
router.put('/:id/schedule', protect, updateSchedule); // New Route

module.exports = router;