// Matching on skills: listings that teach what you want, and members you
// could swap with (they teach what you want AND want what you teach).
const Listing = require("../models/Listing");
const User = require("../models/User");
const escapeRegex = require("../utils/escapeRegex");

const TEACHER_FIELDS = "name rating ratingCount";

// A listing matches a skill by tag, or by the skill appearing as a word in its title
const skillFilter = (skills) => ({
  $or: [{ tags: { $in: skills } }, ...skills.map((s) => ({ title: new RegExp(`(^|\\W)${escapeRegex(s)}(\\W|$)`, "i") }))],
});

const suggestedListings = async (user, limit = 6) => {
  if (!user.skillsRequested?.length) return [];
  return Listing.find({ isActive: true, teacher: { $ne: user._id }, ...skillFilter(user.skillsRequested) })
    .populate("teacher", TEACHER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit);
};

const overlap = (a = [], b = []) => a.filter((x) => b.includes(x));

const barterMatches = async (user, limit = 6) => {
  if (!user.skillsOffered?.length || !user.skillsRequested?.length) return [];

  const candidates = await User.find({
    _id: { $ne: user._id },
    isVerified: true,
    skillsOffered: { $in: user.skillsRequested },
    skillsRequested: { $in: user.skillsOffered },
  })
    .select(`${TEACHER_FIELDS} skillsOffered skillsRequested`)
    .limit(50);

  return candidates
    .map((c) => ({
      user: { _id: c._id, name: c.name, rating: c.rating, ratingCount: c.ratingCount },
      theyTeach: overlap(c.skillsOffered, user.skillsRequested), // you want these
      theyWant: overlap(c.skillsRequested, user.skillsOffered), // you teach these
    }))
    .sort((a, b) => b.theyTeach.length + b.theyWant.length - (a.theyTeach.length + a.theyWant.length))
    .slice(0, limit);
};

module.exports = { suggestedListings, barterMatches, TEACHER_FIELDS };
