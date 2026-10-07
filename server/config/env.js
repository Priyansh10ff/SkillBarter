// Reads and validates environment variables once at startup.
// The process exits with a clear message if anything required is missing.
const { z } = require("zod");

const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string({ error: "MONGO_URI is required" }).min(1, "MONGO_URI is required"),
    // Optional, e.g. "1.1.1.1,8.8.8.8": DNS servers for resolving mongodb+srv:// when the
    // local network's DNS can't (shows up as "querySrv ECONNREFUSED")
    DNS_SERVERS: optional,
    JWT_SECRET: z.string({ error: "JWT_SECRET is required" }).min(16, "JWT_SECRET must be at least 16 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CLIENT_URL: z.url().default("http://localhost:5173"),
    EMAIL_USER: optional,
    EMAIL_PASS: optional,
    // "true" stops all outgoing email (used by the seed script)
    EMAIL_DISABLED: z.preprocess((v) => v === "true" || v === "1", z.boolean()).default(false),
    // Optional TURN relay for video calls behind strict NATs
    TURN_URL: optional,
    TURN_USERNAME: optional,
    TURN_CREDENTIAL: optional,
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".") || "env"}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = parsed.data;
