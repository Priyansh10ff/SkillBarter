const { z } = require("./common");
const { CATEGORIES, DURATIONS } = require("../config/constants");

const fields = {
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  category: z.enum(CATEGORIES, { message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
  duration: z.coerce.number().refine((d) => DURATIONS.includes(d), `Duration must be one of: ${DURATIONS.join(", ")} minutes`),
  tags: z
    .array(z.string().trim().toLowerCase().min(1).max(30))
    .max(8, "Up to 8 tags")
    .transform((list) => [...new Set(list)]),
};

const createListing = z.object({
  ...fields,
  duration: fields.duration.default(60),
  tags: fields.tags.default([]),
});

const updateListing = z
  .object(fields)
  .partial()
  .strip()
  .refine((body) => Object.keys(body).length > 0, "Nothing to update");

const searchQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = { createListing, updateListing, searchQuery };
