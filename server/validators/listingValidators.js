const { z } = require("./common");
const { CATEGORIES, DURATIONS } = require("../config/constants");

const createListing = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  category: z.enum(CATEGORIES, { message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
  duration: z.coerce
    .number()
    .refine((d) => DURATIONS.includes(d), `Duration must be one of: ${DURATIONS.join(", ")} minutes`)
    .default(60),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8).default([]),
});

module.exports = { createListing };
