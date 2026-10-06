const User = require("../models/User");

const MILESTONES = [
  { stat: "classesTaught", at: 5, name: "Teacher Rookie", icon: "🎓" },
  { stat: "classesAttended", at: 5, name: "Dedicated Student", icon: "📚" },
];

// Awards any milestone badges the users have reached and don't have yet.
const checkMilestones = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } }).select("stats badges");
  await Promise.all(
    users.flatMap((user) =>
      MILESTONES.filter((m) => (user.stats?.[m.stat] || 0) >= m.at && !user.badges.some((b) => b.name === m.name)).map((m) =>
        // the name filter makes this safe against two awards racing
        User.updateOne({ _id: user._id, "badges.name": { $ne: m.name } }, { $push: { badges: { name: m.name, icon: m.icon } } })
      )
    )
  );
};

module.exports = { checkMilestones, MILESTONES };
