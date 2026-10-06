// Milestone badges. Each is a rule over a user's stats; awarding is idempotent.
const User = require("../models/User");
const { notify } = require("./notificationService");

const MILESTONES = [
  { code: "taught-1", name: "First lesson", test: (u) => u.stats.classesTaught >= 1 },
  { code: "taught-5", name: "Taught ×5", test: (u) => u.stats.classesTaught >= 5 },
  { code: "taught-10", name: "Taught ×10", test: (u) => u.stats.classesTaught >= 10 },
  { code: "taught-25", name: "Taught ×25", test: (u) => u.stats.classesTaught >= 25 },
  { code: "learned-5", name: "Learned ×5", test: (u) => u.stats.classesAttended >= 5 },
  { code: "learned-10", name: "Learned ×10", test: (u) => u.stats.classesAttended >= 10 },
  { code: "both-sides", name: "Both sides", test: (u) => u.stats.classesTaught >= 1 && u.stats.classesAttended >= 1 },
  { code: "well-rated", name: "Well rated", test: (u) => u.ratingCount >= 5 && u.rating >= 4.5 },
];

// Awards any badges the users now qualify for and don't have yet.
const checkMilestones = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } }).select("name email stats rating ratingCount badges");
  for (const user of users) {
    const have = new Set(user.badges.map((b) => b.code));
    for (const m of MILESTONES) {
      if (have.has(m.code) || !m.test(user)) continue;
      // the code filter makes this safe if two awards race
      const { modifiedCount } = await User.updateOne(
        { _id: user._id, "badges.code": { $ne: m.code } },
        { $push: { badges: { code: m.code, name: m.name } } }
      );
      if (modifiedCount) {
        await notify(user, { type: "badge.earned", message: `You earned a badge: ${m.name}.`, link: `/u/${user._id}` });
      }
    }
  }
};

module.exports = { checkMilestones, MILESTONES };
