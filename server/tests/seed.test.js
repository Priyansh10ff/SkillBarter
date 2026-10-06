const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");
const { runSeed, PASSWORD } = require("../scripts/seed");
const Review = require("../models/Review");

describe("demo seed", () => {
  before(h.startDb);
  after(h.stopDb);

  it("creates a consistent demo world through the real services", async () => {
    await runSeed();
    await h.assertLedgerConsistent();

    assert.equal(await h.models.User.countDocuments(), 6);
    assert.equal(await h.models.Listing.countDocuments(), 10);
    const statuses = (await h.models.Booking.find()).map((b) => b.status).sort();
    assert.deepEqual(statuses, ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "SCHEDULED"]);
    assert.equal(await Review.countDocuments(), 9);

    const asha = await h.models.User.findOne({ email: "asha@example.com" });
    assert.deepEqual(asha.badges.map((b) => b.code).sort(), ["both-sides", "taught-1"]);

    const login = await request(h.app).post("/api/auth/login").send({ email: "asha@example.com", password: PASSWORD });
    assert.equal(login.status, 200);
  });
});
