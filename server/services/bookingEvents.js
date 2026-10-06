// Who hears about each booking change, and what they're told.
const User = require("../models/User");
const { notify } = require("./notificationService");
const { formatDateTime, formatHours } = require("../utils/format");

const idOf = (ref) => String(ref?._id ?? ref);

const load = async (booking) => {
  const users = await User.find({ _id: { $in: [idOf(booking.learner), idOf(booking.teacher)] } }).select("name email timezone");
  const byId = Object.fromEntries(users.map((u) => [String(u._id), u]));
  return {
    learner: byId[idOf(booking.learner)],
    teacher: byId[idOf(booking.teacher)],
    title: `“${booking.listingSnapshot?.title}”`,
    link: `/bookings#${booking._id}`,
    hours: formatHours(booking.creditCost),
  };
};

// The participant who isn't `actorId`
const others = (ctx, actorId) => (idOf(ctx.learner) === String(actorId) ? [ctx.teacher, ctx.learner] : [ctx.learner, ctx.teacher]);

const created = async (booking) => {
  const c = await load(booking);
  await notify(c.teacher, {
    type: "booking.created",
    message: `${c.learner.name} booked ${c.title}. Agree on a time to get it scheduled.`,
    link: c.link,
    email: "New booking",
  });
};

const proposed = async (booking, actorId) => {
  const c = await load(booking);
  const [to, actor] = others(c, actorId);
  await notify(to, {
    type: "booking.proposed",
    message: `${actor.name} proposed ${formatDateTime(booking.proposal.date, to.timezone)} for ${c.title}.`,
    link: c.link,
  });
};

const scheduled = async (booking, actorId) => {
  const c = await load(booking);
  const [to, actor] = others(c, actorId);
  await notify(to, {
    type: "booking.scheduled",
    message: `${actor.name} accepted. ${c.title} is on ${formatDateTime(booking.scheduledAt, to.timezone)}.`,
    link: c.link,
    email: "Session scheduled",
  });
};

const cancelled = async (booking, actorId) => {
  const c = await load(booking);
  const [to, actor] = others(c, actorId);
  const refund = idOf(to._id) === idOf(c.learner._id) ? ` Your ${c.hours} is back in your balance.` : "";
  await notify(to, {
    type: "booking.cancelled",
    message: `${actor.name} cancelled ${c.title}.${refund}`,
    link: c.link,
  });
};

const completed = async (booking, { auto = false } = {}) => {
  const c = await load(booking);
  await notify(c.teacher, {
    type: "credits.received",
    message: auto
      ? `${c.title} with ${c.learner.name} completed automatically. You received ${c.hours}.`
      : `${c.learner.name} confirmed ${c.title}. You received ${c.hours}.`,
    link: "/wallet",
    email: "Credits received",
  });
  if (auto) {
    await notify(c.learner, {
      type: "booking.completed",
      message: `${c.title} was marked done automatically, 48 hours after it ended. ${c.hours} went to ${c.teacher.name}.`,
      link: c.link,
    });
  }
};

const disputed = async (booking) => {
  const c = await load(booking);
  await notify(c.teacher, {
    type: "booking.disputed",
    message: `${c.learner.name} reported a problem with ${c.title}. The credits stay frozen until it's reviewed.`,
    link: c.link,
    email: "A problem was reported",
  });
};

const resolved = async (booking, outcome) => {
  const c = await load(booking);
  const toTeacher = outcome === "release" ? `The report on ${c.title} was reviewed. You received ${c.hours}.` : `The report on ${c.title} was reviewed. The ${c.hours} went back to ${c.learner.name}.`;
  const toLearner = outcome === "release" ? `Your report on ${c.title} was reviewed. The ${c.hours} went to ${c.teacher.name}.` : `Your report on ${c.title} was reviewed. Your ${c.hours} is back in your balance.`;
  await notify(c.teacher, { type: "booking.resolved", message: toTeacher, link: c.link, email: "Report reviewed" });
  await notify(c.learner, { type: "booking.resolved", message: toLearner, link: c.link, email: "Report reviewed" });
};

module.exports = { created, proposed, scheduled, cancelled, completed, disputed, resolved };
