const { z, objectId } = require("./common");
const { BOOKING_STATUS } = require("../config/constants");

const date = z.coerce.date({ message: "Invalid date" });

const createBooking = z.object({
  listingId: objectId,
  proposedDate: date.optional(),
});

const listQuery = z.object({
  role: z.enum(["learner", "teacher"]).optional(),
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
});

const propose = z.object({ date });
const cancel = z.object({ reason: z.string().trim().max(300).optional() });
const dispute = z.object({ reason: z.string().trim().min(5, "Tell us briefly what went wrong").max(500) });
const resolve = z.object({ outcome: z.enum(["release", "refund"]) });
const message = z.object({ body: z.string().trim().min(1, "Write something first").max(1000, "Keep it under 1000 characters") });

module.exports = { createBooking, listQuery, propose, cancel, dispute, resolve, message };
