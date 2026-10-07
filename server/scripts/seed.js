// Demo data for local development and screenshots.
// Goes through the real services, so balances, the credit ledger, stats,
// badges and ratings all add up exactly as they would for real users.
//
//   npm run seed            # refuses if the database already has users
//   npm run seed -- --reset # wipes app data first
//
// Every demo account uses the password: password123
const path = require("path");

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
}
const env = require("../config/env");

if (env.NODE_ENV === "production" && require.main === module) {
  console.error("Refusing to seed with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const { runInTransaction, grantSignupBonus } = require("../services/creditService");
const bookingService = require("../services/bookingService");
const reviewService = require("../services/reviewService");

const PASSWORD = "password123";
const HOUR = 60 * 60 * 1000;

const PEOPLE = [
  { key: "asha", name: "Asha Rao", tz: "Asia/Kolkata", bio: "Second-year CS student. Backend and React, and slowly learning guitar.", offers: ["react", "node"], wants: ["guitar", "figma"], hours: "Weekdays after 19:00" },
  { key: "arjun", name: "Arjun Mehta", tz: "Asia/Kolkata", bio: "Final-year student. Ten years of guitar, mostly acoustic.", offers: ["guitar", "music theory"], wants: ["react", "dsa"], hours: "Weekends 10:00–14:00" },
  { key: "mei", name: "Mei Lin", tz: "Asia/Singapore", bio: "Product designer. Figma, design systems, portfolio reviews.", offers: ["figma", "ui design"], wants: ["spanish", "python"], hours: "Evenings, SGT" },
  { key: "lucia", name: "Lucía Fernández", tz: "Europe/Madrid", bio: "Native Spanish speaker, teaching conversation for A2–B1.", offers: ["spanish"], wants: ["figma", "photography"], hours: "Mornings CET" },
  { key: "kabir", name: "Kabir Singh", tz: "Asia/Kolkata", bio: "Backend engineer. Happy to run mock interviews.", offers: ["system design", "dsa", "python"], wants: ["public speaking", "guitar"], hours: "Saturdays" },
  { key: "sara", name: "Sara Khan", tz: "Asia/Dubai", bio: "Photographer and video editor.", offers: ["photography", "video editing"], wants: ["react", "spanish"], hours: "Flexible" },
];

const LISTINGS = [
  ["asha", "Build your first React component", "Props, state and hooks by building a small todo app together. Bring a laptop with Node installed.", "Coding", 60, ["react"]],
  ["asha", "Node + Express API in an hour", "From an empty folder to a working REST API with validation and error handling.", "Coding", 60, ["node"]],
  ["arjun", "Guitar: first four chords", "G, C, D, Em and a strumming pattern. You'll play a full song by the end.", "Music", 60, ["guitar"]],
  ["arjun", "Music theory for guitarists", "Scales, intervals and why chords sound the way they do.", "Music", 90, ["music theory", "guitar"]],
  ["mei", "Figma auto layout in 30 minutes", "Stop nudging pixels. Frames, constraints and auto layout for real UI.", "Design", 30, ["figma"]],
  ["mei", "Portfolio review", "Bring your portfolio. Honest feedback on case studies, layout and storytelling.", "Career", 60, ["ui design"]],
  ["lucia", "Conversational Spanish practice", "Low-pressure conversation for A2–B1 learners. We'll pick a topic each time.", "Language", 60, ["spanish"]],
  ["kabir", "System design interview mock", "One classic question, a whiteboard, and honest feedback on structure and trade-offs.", "Career", 120, ["system design"]],
  ["kabir", "DSA: two pointers and sliding window", "Patterns, not memorisation. Five problems, solved together.", "Coding", 60, ["dsa"]],
  ["sara", "Phone photography basics", "Light, composition and editing on your phone. Bring your phone.", "Lifestyle", 60, ["photography"]],
];

// [learner, teacher, listing title, outcome, review by learner, review by teacher]
const HISTORY = [
  ["asha", "arjun", "Guitar: first four chords", "completed", [5, "Explained barre chords better than any video. Came with a practice plan."], [5, "Very motivated learner."]],
  ["arjun", "asha", "Build your first React component", "completed", [5, "Clear and patient. Finally get useEffect."], [4, "Asked great questions."]],
  ["mei", "kabir", "DSA: two pointers and sliding window", "completed", [4, "Good pace, lots of examples."], null],
  ["sara", "asha", "Build your first React component", "completed", [4, "Good intro, would book again."], null],
  ["kabir", "arjun", "Guitar: first four chords", "completed", [5, "Fun and structured."], [5, ""]],
  ["lucia", "mei", "Figma auto layout in 30 minutes", "completed", [5, "Exactly what I needed."], null],
  ["asha", "mei", "Figma auto layout in 30 minutes", "scheduled"],
  ["sara", "lucia", "Conversational Spanish practice", "pending"],
];

const startedAgo = (bookingId, hours) => {
  const scheduledAt = new Date(Date.now() - hours * HOUR);
  return Booking.updateOne({ _id: bookingId }, { scheduledAt, endsAt: new Date(scheduledAt.getTime() + HOUR), autoReleaseAt: new Date(Date.now() + 48 * HOUR) });
};

// Creates the demo data on the current connection. Returns the users by key.
const runSeed = async () => {

  const hash = await bcrypt.hash(PASSWORD, process.env.NODE_ENV === "test" ? 4 : 10);
  const users = {};
  for (const p of PEOPLE) {
    const user = await User.create({
      name: p.name,
      email: `${p.key}@example.com`,
      password: hash,
      onboardedAt: new Date(),
      bio: p.bio,
      timezone: p.tz,
      skillsOffered: p.offers,
      skillsRequested: p.wants,
      preferredHours: p.hours,
    });
    await runInTransaction((session) => grantSignupBonus(user._id, session));
    users[p.key] = user;
  }

  const listings = {};
  for (const [who, title, description, category, duration, tags] of LISTINGS) {
    listings[title] = await Listing.create({ teacher: users[who]._id, title, description, category, duration, tags });
  }

  const fresh = async (key) => User.findById(users[key]._id);

  for (const [learnerKey, teacherKey, title, outcome, learnerReview, teacherReview] of HISTORY) {
    const learner = await fresh(learnerKey);
    const booking = await bookingService.create({ learner, listingId: listings[title]._id, proposedDate: new Date(Date.now() + 26 * HOUR) });
    if (outcome === "pending") continue;

    await bookingService.accept({ bookingId: booking._id, userId: users[teacherKey]._id });
    if (outcome === "scheduled") continue;

    await startedAgo(booking._id, 30);
    await bookingService.complete({ bookingId: booking._id, userId: users[learnerKey]._id });
    if (learnerReview) await reviewService.create({ bookingId: booking._id, authorId: users[learnerKey]._id, rating: learnerReview[0], comment: learnerReview[1] });
    if (teacherReview) await reviewService.create({ bookingId: booking._id, authorId: users[teacherKey]._id, rating: teacherReview[0], comment: teacherReview[1] });
  }

  return users;
};

const main = async () => {
  try {
    require("../config/db").applyDnsServers();
    await mongoose.connect(env.MONGO_URI);
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

    if (process.argv.includes("--reset")) {
      await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
      console.log("Cleared existing data.");
    } else if (await User.exists({})) {
      console.error("The database already has users. Run `npm run seed -- --reset` to wipe it first.");
      process.exit(1);
    }

    await runSeed();

    console.log("\nSeeded demo data. Log in with any of these (password: password123):\n");
    for (const p of PEOPLE) {
      const u = await User.findOne({ email: `${p.key}@example.com` });
      console.log(`  ${u.email.padEnd(22)} ${u.name.padEnd(18)} balance ${u.timeCredits} h`);
    }
    console.log("\nasha@example.com has a scheduled session with Mei, and sara@example.com a pending one with Lucía.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

if (require.main === module) main();

module.exports = { runSeed, PEOPLE, PASSWORD };
