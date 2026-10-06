const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");
const { resetStatsCache } = require("../controllers/statsController");

const inHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("reviews, badges, leaderboard and stats", () => {
  let teacher;
  let learner;
  let listing;

  before(h.startDb);
  after(h.stopDb);
  beforeEach(async () => {
    await h.clearDb();
    resetStatsCache();
    teacher = await h.createUser({ name: "Teacher" });
    learner = await h.createUser({ name: "Learner" });
    listing = await h.createListing(teacher.user._id);
  });

  // book → schedule → start → complete
  const completedBooking = async (l = learner, t = teacher, lst = listing) => {
    const { body } = await request(h.app).post("/api/bookings").set(l.auth).send({ listingId: String(lst._id), proposedDate: inHours(24) });
    await request(h.app).post(`/api/bookings/${body._id}/accept`).set(t.auth);
    await h.startSessionAgo(body._id, 70);
    const done = await request(h.app).post(`/api/bookings/${body._id}/complete`).set(l.auth);
    assert.equal(done.status, 200);
    return body._id;
  };
  const review = (who, bookingId, rating, comment = "") => request(h.app).post("/api/reviews").set(who.auth).send({ bookingId, rating, comment });

  it("both sides can review a completed session once, and ratings average", async () => {
    const id = await completedBooking();

    assert.equal((await review(learner, id, 6)).status, 400);
    assert.equal((await review(learner, id, 5, "Clear and patient")).status, 201);
    assert.equal((await review(learner, id, 1)).status, 409);
    assert.equal((await review(teacher, id, 4, "Came prepared")).status, 201);

    // a second session: average of 5 and 3 = 4
    const id2 = await completedBooking();
    await review(learner, id2, 3);
    const t = await h.models.User.findById(teacher.user._id);
    assert.equal(t.ratingCount, 2);
    assert.equal(t.rating, 4);

    const list = await request(h.app).get(`/api/reviews/user/${teacher.user._id}`);
    assert.equal(list.body.length, 2);
    assert.equal(list.body[1].comment, "Clear and patient");
    assert.equal(list.body[1].author.name, "Learner");
    assert.equal(list.body[0].author.email, undefined);

    const booking = await request(h.app).get(`/api/bookings/${id}`).set(learner.auth);
    assert.equal(booking.body.reviewedByLearner, true);
    assert.equal(booking.body.reviewedByTeacher, true);
  });

  it("only participants of completed sessions can review", async () => {
    const { body: pending } = await request(h.app).post("/api/bookings").set(learner.auth).send({ listingId: String(listing._id) });
    assert.equal((await review(learner, pending._id, 5)).status, 400);

    const id = await completedBooking();
    const outsider = await h.createUser();
    assert.equal((await review(outsider, id, 5)).status, 404);
  });

  it("parallel reviews from the same person count once", async () => {
    const id = await completedBooking();
    const results = await Promise.all(Array.from({ length: 4 }, () => review(learner, id, 5)));
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal((await h.models.User.findById(teacher.user._id)).ratingCount, 1);
  });

  it("awards badges once and notifies", async () => {
    await completedBooking();
    let t = await h.models.User.findById(teacher.user._id);
    assert.deepEqual(t.badges.map((b) => b.code), ["taught-1"]);

    // the teacher learns something too → "both sides"
    const other = await h.createUser({ name: "Other" });
    const otherListing = await h.createListing(other.user._id);
    await completedBooking(teacher, other, otherListing);
    t = await h.models.User.findById(teacher.user._id);
    assert.deepEqual(t.badges.map((b) => b.code).sort(), ["both-sides", "taught-1"]);

    const notes = await request(h.app).get("/api/notifications").set(teacher.auth);
    assert.ok(notes.body.items.some((n) => n.message === "You earned a badge: First lesson."));
  });

  it("leaderboard sorts by sessions taught or by rating (3+ reviews)", async () => {
    await completedBooking();
    const lb = await request(h.app).get("/api/users/leaderboard");
    assert.deepEqual(lb.body.map((u) => u.name), ["Teacher"]);
    assert.equal((await request(h.app).get("/api/users/leaderboard?sort=rated")).body.length, 0);
    assert.equal((await request(h.app).get("/api/users/leaderboard?sort=nope")).status, 400);
  });

  it("public stats count members, sessions and hours", async () => {
    await completedBooking();
    const stats = await request(h.app).get("/api/stats");
    assert.deepEqual(stats.body, { members: 2, sessionsCompleted: 1, hoursExchanged: 1, openListings: 1 });
  });
});
