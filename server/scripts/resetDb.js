// Wipes all app data. Development only.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const env = require("../config/env");

if (env.NODE_ENV === "production") {
  console.error("Refusing to reset the database with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const CreditEntry = require("../models/CreditEntry");

const reset = async () => {
  try {
    require("../config/db").applyDnsServers();
    await mongoose.connect(env.MONGO_URI);
    await Promise.all([User, Listing, Booking, CreditEntry].map((model) => model.deleteMany({})));
    // collection left over from the old Transaction model
    await mongoose.connection.db.dropCollection("transactions").catch(() => {});
    console.log("Database cleared.");
    process.exit(0);
  } catch (error) {
    console.error(`Reset failed: ${error.message}`);
    process.exit(1);
  }
};

reset();
