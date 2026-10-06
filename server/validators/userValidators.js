const { z, skillList } = require("./common");
const { password } = require("./authValidators");

const isTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const profile = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
    bio: z.string().trim().max(500, "Bio must be at most 500 characters"),
    skillsOffered: skillList,
    skillsRequested: skillList,
    preferredHours: z.string().trim().max(100),
    timezone: z.string().refine(isTimezone, "Unknown timezone"),
    onboarded: z.literal(true), // finishing the setup steps
  })
  .partial()
  .strip();

const changePassword = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
});

const leaderboardQuery = z.object({ sort: z.enum(["taught", "rated"]).default("taught") });

module.exports = { profile, changePassword, leaderboardQuery };
