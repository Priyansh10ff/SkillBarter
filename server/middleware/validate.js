const AppError = require("../utils/AppError");

// validate({ params, query, body }) parses each part with its zod schema.
// Parsed values land on req.valid.params / req.valid.query / req.valid.body.
const validate = (schemas) => (req, res, next) => {
  req.valid = req.valid || {};
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
      throw new AppError(400, details[0]?.message || "Invalid request", details);
    }
    req.valid[part] = result.data;
  }
  next();
};

module.exports = validate;
