const { z, skillList } = require("./common");

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

const register = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  skills: skillList.optional(), // skills they can teach
});

const login = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const tokenParam = z.object({ token: z.string().regex(/^[a-f\d]{64}$/i, "Invalid or expired link") });

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
    name: z.string().trim().min(2).max(60),
    bio: z.string().trim().max(500),
    skillsOffered: skillList,
    skillsRequested: skillList,
    preferredHours: z.string().trim().max(100),
    timezone: z.string().refine(isTimezone, "Unknown timezone"),
  })
  .partial()
  .strip();

module.exports = { register, login, tokenParam, profile };
