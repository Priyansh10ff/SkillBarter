// Wipes every user, listing and transaction. Development only.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset the database with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");

const resetData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([User.deleteMany(), Listing.deleteMany(), Transaction.deleteMany()]);
    console.log("Database cleared.");
    process.exit(0);
  } catch (error) {
    console.error(`Reset failed: ${error.message}`);
    process.exit(1);
  }
};

resetData();
