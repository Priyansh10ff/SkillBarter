const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const idParam = z.object({ id: objectId });

const skill = z.string().trim().toLowerCase().min(1).max(40);
const skillList = z
  .array(skill)
  .max(15, "Up to 15 skills")
  .transform((list) => [...new Set(list)]);

const page = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = { z, objectId, idParam, skillList, page };
