const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");
const { autoReleaseDue } = require("../services/bookingService");

const inHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("bookings and credits", () => {
  let teacher;
  let learner;
  let listing;

  before(h.startDb);
  after(h.stopDb);
  beforeEach(async () => {
    await h.clearDb();
    teacher = await h.createUser({ name: "Teacher" });
    learner = await h.createUser({ name: "Learner" });
    listing = await h.createListing(teacher.user._id, { duration: 60 });
  });

  const book = (who = learner, body = {}) =>
    request(h.app).post("/api/bookings").set(who.auth).send({ listingId: String(listing._id), ...body });
  const act = (who, id, action, body = {}) => request(h.app).post(`/api/bookings/${id}/${action}`).set(who.auth).send(body);

  // book → propose (learner) → accept (teacher)
  const scheduled = async () => {
    const { body } = await book(learner, { proposedDate: inHours(24) });
    const res = await act(teacher, body._id, "accept");
    assert.equal(res.status, 200, res.body.message);
    return body._id;
  };

  it("booking holds the learner's credits", async () => {
    const res = await book();
    assert.equal(res.status, 201);
    assert.equal(res.body.status, "PENDING");
    assert.equal(res.body.creditCost, 1);
    assert.equal(await h.balanceOf(learner.user._id), 1);
    assert.equal(await h.balanceOf(teacher.user._id), 2);

    const wallet = await request(h.app).get("/api/wallet").set(learner.auth);
    assert.equal(wallet.body.balance, 1);
    assert.equal(wallet.body.held, 1);
    assert.deepEqual(wallet.body.entries.map((e) => e.type), ["BOOKING_HOLD", "SIGNUP_BONUS"]);
    await h.assertLedgerConsistent();
  });

  it("rejects self-booking, missing listings and empty wallets", async () => {
    assert.equal((await book(teacher)).status, 400);

    assert.equal((await request(h.app).post("/api/bookings").set(learner.auth).send({ listingId: "a".repeat(24) })).status, 404);

    assert.equal((await book()).status, 201);
    assert.equal((await book()).status, 201);
    const broke = await book();
    assert.equal(broke.status, 400);
    assert.equal(broke.body.message, "Not enough credits");
    await h.assertLedgerConsistent();
  });

  it("time negotiation: only the other person can accept", async () => {
    const { body } = await book();
    assert.equal((await act(teacher, body._id, "accept")).status, 400); // nothing proposed

    assert.equal((await act(learner, body._id, "propose", { date: inHours(-1) })).status, 400);
    assert.equal((await act(learner, body._id, "propose", { date: inHours(24) })).status, 200);
    assert.equal((await act(learner, body._id, "accept")).status, 403);

    // teacher counters, learner accepts
    assert.equal((await act(teacher, body._id, "propose", { date: inHours(48) })).status, 200);
    const accepted = await act(learner, body._id, "accept");
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.status, "SCHEDULED");
    assert.ok(accepted.body.autoReleaseAt);
  });

  it("outsiders can't see or touch a booking", async () => {
    const outsider = await h.createUser();
    const { body } = await book();
    assert.equal((await request(h.app).get(`/api/bookings/${body._id}`).set(outsider.auth)).status, 404);
    assert.equal((await act(outsider, body._id, "cancel")).status, 404);
    assert.equal((await request(h.app).get("/api/bookings").set(outsider.auth)).body.length, 0);
  });

  it("cancelling before the session refunds the learner", async () => {
    const id = await scheduled();
    const res = await act(teacher, id, "cancel", { reason: "Something came up" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "CANCELLED");
    assert.equal(await h.balanceOf(learner.user._id), 2);
    assert.equal((await act(learner, id, "cancel")).status, 400);
    await h.assertLedgerConsistent();
  });

  it("completing pays the teacher once, only after the session starts, only by the learner", async () => {
    const id = await scheduled();
    assert.equal((await act(learner, id, "complete")).status, 400); // not started yet

    await h.startSessionAgo(id, 10);
    assert.equal((await act(teacher, id, "complete")).status, 403);
    assert.equal((await act(learner, id, "cancel")).status, 400); // started: report instead

    const res = await act(learner, id, "complete");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "COMPLETED");
    assert.equal(await h.balanceOf(teacher.user._id), 3);
    assert.equal(await h.balanceOf(learner.user._id), 1);

    const t = await h.models.User.findById(teacher.user._id);
    const l = await h.models.User.findById(learner.user._id);
    assert.equal(t.stats.classesTaught, 1);
    assert.equal(l.stats.classesAttended, 1);

    assert.equal((await act(learner, id, "complete")).status, 400);
    await h.assertLedgerConsistent();
  });

  it("auto-releases after the window and when bookings are listed", async () => {
    const id = await scheduled();
    await h.startSessionAgo(id, 60 * 50, { releaseInHours: -1 });

    const list = await request(h.app).get("/api/bookings").set(teacher.auth);
    assert.equal(list.body[0].status, "COMPLETED");
    assert.equal(await h.balanceOf(teacher.user._id), 3);
    assert.equal(await autoReleaseDue(), 0);
    await h.assertLedgerConsistent();
  });

  it("disputes freeze credits until an admin resolves them", async () => {
    const admin = await h.createUser({ role: "admin" });
    const id = await scheduled();
    await h.startSessionAgo(id, 90);

    assert.equal((await act(learner, id, "dispute", { reason: "no" })).status, 400); // too short
    const disputed = await act(learner, id, "dispute", { reason: "Teacher never showed up" });
    assert.equal(disputed.body.status, "DISPUTED");

    // frozen: no completion, no auto-release
    assert.equal((await act(learner, id, "complete")).status, 400);
    await h.models.Booking.updateOne({ _id: id }, { autoReleaseAt: new Date(Date.now() - 1000) });
    assert.equal(await autoReleaseDue(), 0);

    assert.equal((await request(h.app).get("/api/admin/disputes").set(learner.auth)).status, 403);
    const open = await request(h.app).get("/api/admin/disputes").set(admin.auth);
    assert.equal(open.body.length, 1);

    const resolved = await request(h.app).post(`/api/admin/disputes/${id}/resolve`).set(admin.auth).send({ outcome: "refund" });
    assert.equal(resolved.body.status, "CANCELLED");
    assert.equal(resolved.body.dispute.outcome, "refund");
    assert.equal(await h.balanceOf(learner.user._id), 2);
    await h.assertLedgerConsistent();
  });

  it("a dispute can also be resolved in the teacher's favour", async () => {
    const admin = await h.createUser({ role: "admin" });
    const id = await scheduled();
    await h.startSessionAgo(id, 90);
    await act(learner, id, "dispute", { reason: "Session was cut short" });

    const resolved = await request(h.app).post(`/api/admin/disputes/${id}/resolve`).set(admin.auth).send({ outcome: "release" });
    assert.equal(resolved.body.status, "COMPLETED");
    assert.equal(await h.balanceOf(teacher.user._id), 3);
    await h.assertLedgerConsistent();
  });

  describe("concurrency", () => {
    it("parallel bookings never overspend", async () => {
      const results = await Promise.all(Array.from({ length: 6 }, () => book()));
      const created = results.filter((r) => r.status === 201).length;
      assert.equal(created, 2);
      assert.equal(await h.balanceOf(learner.user._id), 0);
      await h.assertLedgerConsistent();
    });

    it("parallel completes pay the teacher exactly once", async () => {
      const id = await scheduled();
      await h.startSessionAgo(id, 10);
      const results = await Promise.all(Array.from({ length: 5 }, () => act(learner, id, "complete")));
      assert.equal(results.filter((r) => r.status === 200).length, 1);
      assert.equal(await h.balanceOf(teacher.user._id), 3);
      await h.assertLedgerConsistent();
    });

    it("cancel racing complete moves credits exactly once", async () => {
      const id = await scheduled();
      await h.startSessionAgo(id, 10);
      await Promise.all([act(learner, id, "complete"), act(learner, id, "cancel"), act(teacher, id, "cancel"), autoReleaseDue()]);
      await h.assertLedgerConsistent();
    });
  });
});
