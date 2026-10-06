// Booking state machine. See docs/TECHNICAL.md section 5.
//
//   PENDING ──accept──► SCHEDULED ──complete / auto-release──► COMPLETED
//      │                   │  └──dispute──► DISPUTED ──admin──► COMPLETED | CANCELLED
//      └────cancel─────────┴──(before start)──► CANCELLED
//
// Every transition is a conditional update on the current status, so two
// requests racing on the same booking can never both succeed.
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { runInTransaction, applyCredit } = require("./creditService");
const { checkMilestones } = require("./badgeService");
const { emitToUser } = require("./realtime");
const {
  BOOKING_STATUS: S,
  CREDIT_TYPES,
  AUTO_RELEASE_HOURS,
  MIN_LEAD_MINUTES,
  MAX_DAYS_AHEAD,
} = require("../config/constants");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const idOf = (ref) => String(ref?._id ?? ref);
const isLearner = (booking, userId) => idOf(booking.learner) === String(userId);
const isTeacher = (booking, userId) => idOf(booking.teacher) === String(userId);

const populate = (query) =>
  query
    .populate("learner", "name rating")
    .populate("teacher", "name rating")
    .populate("listing", "title duration category isActive");

const assertProposableDate = (date) => {
  const now = Date.now();
  if (date.getTime() < now + MIN_LEAD_MINUTES * MINUTE) {
    throw new AppError(400, `Pick a time at least ${MIN_LEAD_MINUTES} minutes from now`);
  }
  if (date.getTime() > now + MAX_DAYS_AHEAD * 24 * HOUR) {
    throw new AppError(400, `Pick a time within the next ${MAX_DAYS_AHEAD} days`);
  }
};

// Moves a booking from one of `from` to a new state, or fails with 409 if
// someone else changed it first.
const transition = async (bookingId, from, update, session, extraFilter = {}) => {
  const booking = await Booking.findOneAndUpdate({ _id: bookingId, status: { $in: from }, ...extraFilter }, update, {
    returnDocument: "after",
    session,
  });
  if (!booking) throw new AppError(409, "This booking changed in the meantime. Refresh and try again.");
  return booking;
};

const notifyChange = (booking) => {
  emitToUser(booking.learner, "booking:update", { bookingId: String(booking._id), status: booking.status });
  emitToUser(booking.teacher, "booking:update", { bookingId: String(booking._id), status: booking.status });
};

const notifyBalance = (user) => emitToUser(user._id, "credit_update", user.timeCredits);

// Loads a booking the user takes part in. Non-participants get 404, not 403,
// so booking ids can't be probed.
const getForParticipant = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || !(isLearner(booking, userId) || isTeacher(booking, userId))) {
    throw new AppError(404, "Booking not found");
  }
  return booking;
};

const getById = async (bookingId, userId) => {
  await getForParticipant(bookingId, userId);
  return populate(Booking.findById(bookingId));
};

const create = async ({ learner, listingId, proposedDate }) => {
  if (!learner.isVerified) throw new AppError(403, "Verify your email before booking");

  const listing = await Listing.findById(listingId);
  if (!listing || !listing.isActive) throw new AppError(404, "Listing not found");
  if (idOf(listing.teacher) === idOf(learner._id)) throw new AppError(400, "You can't book your own listing");
  if (proposedDate) assertProposableDate(proposedDate);

  const creditCost = listing.duration / 60;
  let booking;
  let updatedLearner;

  await runInTransaction(async (session) => {
    [booking] = await Booking.create(
      [
        {
          learner: learner._id,
          teacher: listing.teacher,
          listing: listing._id,
          listingSnapshot: { title: listing.title, duration: listing.duration, category: listing.category },
          creditCost,
          status: S.PENDING,
          ...(proposedDate ? { proposal: { date: proposedDate, by: learner._id } } : {}),
        },
      ],
      { session }
    );
    updatedLearner = await applyCredit(
      { userId: learner._id, amount: -creditCost, type: CREDIT_TYPES.BOOKING_HOLD, bookingId: booking._id },
      session
    );
  });

  notifyBalance(updatedLearner);
  notifyChange(booking);
  return populate(Booking.findById(booking._id));
};

const propose = async ({ bookingId, userId, date }) => {
  await getForParticipant(bookingId, userId);
  assertProposableDate(date);
  const booking = await transition(bookingId, [S.PENDING], { proposal: { date, by: userId } });
  notifyChange(booking);
  return populate(Booking.findById(bookingId));
};

const accept = async ({ bookingId, userId }) => {
  const current = await getForParticipant(bookingId, userId);
  if (current.status !== S.PENDING) throw new AppError(400, "Only pending bookings can be scheduled");
  if (!current.proposal?.date) throw new AppError(400, "There is no proposed time to accept");
  if (idOf(current.proposal.by) === String(userId)) throw new AppError(403, "The other person has to accept your proposal");
  if (current.proposal.date.getTime() <= Date.now()) throw new AppError(400, "That time has passed. Propose a new one.");

  const scheduledAt = current.proposal.date;
  const endsAt = new Date(scheduledAt.getTime() + current.listingSnapshot.duration * MINUTE);
  const autoReleaseAt = new Date(endsAt.getTime() + AUTO_RELEASE_HOURS * HOUR);

  const booking = await transition(
    bookingId,
    [S.PENDING],
    { status: S.SCHEDULED, scheduledAt, endsAt, autoReleaseAt, $unset: { proposal: 1 } },
    undefined,
    // the proposal must still be the one we just checked
    { "proposal.date": scheduledAt, "proposal.by": current.proposal.by }
  );
  notifyChange(booking);
  return populate(Booking.findById(bookingId));
};

const cancel = async ({ bookingId, userId, reason }) => {
  const current = await getForParticipant(bookingId, userId);
  const now = new Date();

  if (current.status === S.SCHEDULED && current.scheduledAt <= now) {
    throw new AppError(400, "The session has already started. Report a problem instead.");
  }
  if (![S.PENDING, S.SCHEDULED].includes(current.status)) throw new AppError(400, "This booking can't be cancelled");

  let booking;
  let learner;
  await runInTransaction(async (session) => {
    booking = await transition(
      bookingId,
      [S.PENDING, S.SCHEDULED],
      { status: S.CANCELLED, cancelledBy: userId, cancelReason: reason, $unset: { proposal: 1 } },
      session,
      { $or: [{ status: S.PENDING }, { scheduledAt: { $gt: now } }] }
    );
    learner = await applyCredit(
      { userId: booking.learner, amount: booking.creditCost, type: CREDIT_TYPES.REFUND, bookingId: booking._id },
      session
    );
  });

  notifyBalance(learner);
  notifyChange(booking);
  return populate(Booking.findById(bookingId));
};

// Pays the teacher and closes the booking. Shared by complete, auto-release
// and dispute resolution.
const releaseToTeacher = async (bookingId, from, extraFilter = {}, extraUpdate = {}) => {
  let booking;
  let teacher;
  await runInTransaction(async (session) => {
    booking = await transition(bookingId, from, { status: S.COMPLETED, completedAt: new Date(), ...extraUpdate }, session, extraFilter);
    teacher = await applyCredit(
      { userId: booking.teacher, amount: booking.creditCost, type: CREDIT_TYPES.SESSION_EARNING, bookingId: booking._id },
      session
    );
    await User.updateOne({ _id: booking.teacher }, { $inc: { "stats.classesTaught": 1 } }, { session });
    await User.updateOne({ _id: booking.learner }, { $inc: { "stats.classesAttended": 1 } }, { session });
  });

  notifyBalance(teacher);
  notifyChange(booking);
  await checkMilestones([booking.teacher, booking.learner]);
  return booking;
};

const complete = async ({ bookingId, userId }) => {
  const current = await getForParticipant(bookingId, userId);
  if (!isLearner(current, userId)) throw new AppError(403, "Only the learner can confirm the session");
  if (current.status !== S.SCHEDULED) throw new AppError(400, "Only scheduled sessions can be confirmed");
  if (current.scheduledAt > new Date()) throw new AppError(400, "You can confirm once the session has started");

  await releaseToTeacher(bookingId, [S.SCHEDULED], { scheduledAt: { $lte: new Date() } });
  return populate(Booking.findById(bookingId));
};

const dispute = async ({ bookingId, userId, reason }) => {
  const current = await getForParticipant(bookingId, userId);
  if (!isLearner(current, userId)) throw new AppError(403, "Only the learner can report a problem");
  if (current.status !== S.SCHEDULED) throw new AppError(400, "Only scheduled sessions can be reported");

  const now = new Date();
  if (current.scheduledAt > now) throw new AppError(400, "The session hasn't started. Cancel it instead.");
  if (current.autoReleaseAt <= now) throw new AppError(400, "The reporting window for this session has closed");

  const booking = await transition(
    bookingId,
    [S.SCHEDULED],
    { status: S.DISPUTED, dispute: { reason, openedAt: now } },
    undefined,
    { scheduledAt: { $lte: now }, autoReleaseAt: { $gt: now } }
  );
  notifyChange(booking);
  return populate(Booking.findById(bookingId));
};

const resolveDispute = async ({ bookingId, outcome }) => {
  const resolved = { "dispute.resolvedAt": new Date(), "dispute.outcome": outcome };

  if (outcome === "release") {
    await releaseToTeacher(bookingId, [S.DISPUTED], {}, resolved);
  } else {
    let booking;
    let learner;
    await runInTransaction(async (session) => {
      booking = await transition(bookingId, [S.DISPUTED], { status: S.CANCELLED, ...resolved }, session);
      learner = await applyCredit(
        { userId: booking.learner, amount: booking.creditCost, type: CREDIT_TYPES.REFUND, bookingId: booking._id },
        session
      );
    });
    notifyBalance(learner);
    notifyChange(booking);
  }
  return populate(Booking.findById(bookingId));
};

// Completes SCHEDULED bookings whose reporting window has passed.
// Runs on a timer, and also before a user's bookings are listed so a
// sleeping server catches up as soon as someone looks.
const autoReleaseDue = async ({ userId } = {}) => {
  const filter = { status: S.SCHEDULED, autoReleaseAt: { $lte: new Date() } };
  if (userId) filter.$or = [{ learner: userId }, { teacher: userId }];

  const due = await Booking.find(filter).select("_id").limit(200);
  let released = 0;
  for (const { _id } of due) {
    try {
      await releaseToTeacher(_id, [S.SCHEDULED], { autoReleaseAt: { $lte: new Date() } });
      released += 1;
    } catch (error) {
      if (error.statusCode !== 409) console.error(`Auto-release failed for booking ${_id}:`, error);
    }
  }
  return released;
};

const listForUser = async ({ userId, role, status }) => {
  await autoReleaseDue({ userId });

  const filter = {};
  if (role === "learner") filter.learner = userId;
  else if (role === "teacher") filter.teacher = userId;
  else filter.$or = [{ learner: userId }, { teacher: userId }];
  if (status) filter.status = status;

  return populate(Booking.find(filter).sort({ createdAt: -1 }));
};

const listDisputes = () => populate(Booking.find({ status: S.DISPUTED }).sort({ "dispute.openedAt": 1 }));

module.exports = {
  create,
  propose,
  accept,
  cancel,
  complete,
  dispute,
  resolveDispute,
  autoReleaseDue,
  listForUser,
  listDisputes,
  getById,
};
