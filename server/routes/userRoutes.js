const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getLeaderboard, updateProfile, verifyEmail } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/verify-email/:token', verifyEmail);

module.exports = router;