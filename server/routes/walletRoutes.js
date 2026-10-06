const express = require("express");
const { getWallet } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { page } = require("../validators/common");

const router = express.Router();

router.get("/", protect, validate({ query: page }), getWallet);

module.exports = router;
