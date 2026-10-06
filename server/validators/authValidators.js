const { z, skillList } = require("./common");

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));
const password = z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters");

const register = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email,
  password,
  skills: skillList.optional(), // skills they can teach
});

const login = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const emailOnly = z.object({ email });

const tokenParam = z.object({ token: z.string().regex(/^[a-f\d]{64}$/i, "This link is invalid or has expired") });

const resetPassword = z.object({ password });

module.exports = { register, login, emailOnly, tokenParam, resetPassword, password };
