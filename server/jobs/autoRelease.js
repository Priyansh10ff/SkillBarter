const cron = require("node-cron");
const { autoReleaseDue } = require("../services/bookingService");

const run = async () => {
  try {
    const released = await autoReleaseDue();
    if (released) console.log(`Auto-released ${released} booking(s)`);
  } catch (error) {
    console.error("Auto-release job failed:", error);
  }
};

// Every 10 minutes, plus once on boot to catch up after the server slept.
const startAutoReleaseJob = () => {
  run();
  return cron.schedule("*/10 * * * *", run);
};

module.exports = { startAutoReleaseJob };
