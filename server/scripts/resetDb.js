// Wipes all app data. Development only.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const env = require("../config/env");

if (env.NODE_ENV === "production") {
  console.error("Refusing to reset the database with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");

const reset = async () => {
  try {
    require("../config/db").applyDnsServers();
    await mongoose.connect(env.MONGO_URI);
    // Empties every collection but keeps them (and their indexes)
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
    console.log(`Database "${mongoose.connection.name}" cleared (${collections.length} collections).`);
    process.exit(0);
  } catch (error) {
    console.error(`Reset failed: ${error.message}`);
    process.exit(1);
  }
};

reset();
