// Usage: npm run make-admin -- someone@example.com
// Admins can see and resolve reported problems (/api/admin/disputes).
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const env = require("../config/env");
const mongoose = require("mongoose");
const User = require("../models/User");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- someone@example.com");
  process.exit(1);
}

(async () => {
  try {
    require("../config/db").applyDnsServers();
    await mongoose.connect(env.MONGO_URI);
    const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after" });
    if (!user) {
      console.error(`No account with email ${email}`);
      process.exit(1);
    }
    console.log(`${user.name} <${user.email}> is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
})();
