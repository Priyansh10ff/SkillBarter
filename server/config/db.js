const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");

// Some home and campus networks can't answer the SRV lookup that mongodb+srv:// needs.
// DNS_SERVERS=1.1.1.1,8.8.8.8 makes Node ask public resolvers instead.
const applyDnsServers = () => {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean));
};

const connectDB = async () => {
  applyDnsServers();
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (/querySrv|ENOTFOUND|ECONNREFUSED/.test(error.message) && !env.DNS_SERVERS) {
      console.error("Looks like a DNS problem. Add DNS_SERVERS=1.1.1.1,8.8.8.8 to server/.env and try again.");
    }
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.applyDnsServers = applyDnsServers;
