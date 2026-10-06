const { z, objectId } = require("./common");

const createReview = z.object({
  bookingId: objectId,
  rating: z.coerce.number().int("Pick 1 to 5").min(1, "Pick 1 to 5").max(5, "Pick 1 to 5"),
  comment: z.string().trim().max(500, "Keep it under 500 characters").default(""),
});

module.exports = { createReview };
