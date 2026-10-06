const Booking = require("../models/Booking");
const Review = require("../models/Review");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { runInTransaction } = require("./creditService");
const { checkMilestones } = require("./badgeService");
const { notify } = require("./notificationService");
const { BOOKING_STATUS: S } = require("../config/constants");

const create = async ({ bookingId, authorId, rating, comment }) => {
  const booking = await Booking.findById(bookingId);
  const isLearner = booking && String(booking.learner) === String(authorId);
  const isTeacher = booking && String(booking.teacher) === String(authorId);
  if (!booking || !(isLearner || isTeacher)) throw new AppError(404, "Booking not found");
  if (booking.status !== S.COMPLETED) throw new AppError(400, "You can review a session once it's completed");

  const role = isLearner ? "learner" : "teacher";
  const flag = isLearner ? "reviewedByLearner" : "reviewedByTeacher";
  const subject = isLearner ? booking.teacher : booking.learner;

  let review;
  await runInTransaction(async (session) => {
    // the flag doubles as a lock: only one review per side gets through
    const claimed = await Booking.updateOne({ _id: bookingId, [flag]: false }, { [flag]: true }, { session });
    if (!claimed.modifiedCount) throw new AppError(409, "You've already reviewed this session");

    [review] = await Review.create([{ booking: bookingId, author: authorId, subject, role, rating, comment }], { session });

    // running average, computed in the database so concurrent reviews can't clobber it
    await User.updateOne(
      { _id: subject },
      [
        {
          $set: {
            rating: { $divide: [{ $add: [{ $multiply: ["$rating", "$ratingCount"] }, rating] }, { $add: ["$ratingCount", 1] }] },
            ratingCount: { $add: ["$ratingCount", 1] },
          },
        },
      ],
      // Mongoose 9 requires opting in to pipeline-style updates
      { session, updatePipeline: true }
    );
  });

  const [author, subjectUser] = await Promise.all([User.findById(authorId).select("name"), User.findById(subject).select("name email")]);
  await notify(subjectUser, {
    type: "review.received",
    message: `${author.name} rated your session ${rating}/5${comment ? `: “${comment.slice(0, 80)}${comment.length > 80 ? "…" : ""}”` : "."}`,
    link: `/u/${subject}`,
  });
  await checkMilestones([subject]);
  return review;
};

const forUser = (userId, limit = 20) =>
  Review.find({ subject: userId }).sort({ createdAt: -1 }).limit(limit).populate("author", "name").populate("booking", "listingSnapshot.title");

module.exports = { create, forUser };
