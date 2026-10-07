const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");

describe("users", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(h.clearDb);

  it("updates the profile with validated fields only", async () => {
    const { auth } = await h.createUser();
    const res = await request(h.app)
      .put("/api/users/me")
      .set(auth)
      .send({ bio: "Hi", skillsRequested: ["Figma"], timezone: "Asia/Kolkata", timeCredits: 999, role: "admin" });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.skillsRequested, ["figma"]);
    assert.equal(res.body.timeCredits, 2);
    assert.equal(res.body.role, "user");

    assert.equal((await request(h.app).put("/api/users/me").set(auth).send({ timezone: "Mars/Base" })).status, 400);
    assert.equal((await request(h.app).put("/api/users/me").set(auth).send({ bio: "x".repeat(501) })).status, 400);
  });

  it("marks onboarding done once", async () => {
    const { auth } = await h.createUser();
    const first = await request(h.app).put("/api/users/me").set(auth).send({ onboarded: true, skillsOffered: ["chess"] });
    assert.ok(first.body.onboardedAt);
    const second = await request(h.app).put("/api/users/me").set(auth).send({ onboarded: true });
    assert.equal(second.body.onboardedAt, first.body.onboardedAt);
  });

  it("changes the password and logs out other sessions", async () => {
    const { auth, user } = await h.createUser();
    await new Promise((r) => setTimeout(r, 1100)); // iat has 1s resolution

    const wrong = await request(h.app).put("/api/users/me/password").set(auth).send({ currentPassword: "nope", newPassword: "another-pass" });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.details[0].field, "currentPassword");

    const ok = await request(h.app).put("/api/users/me/password").set(auth).send({ currentPassword: "password123", newPassword: "another-pass" });
    assert.equal(ok.status, 200);

    assert.equal((await request(h.app).get("/api/users/me").set(auth)).status, 401);
    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", `Bearer ${ok.body.token}`)).status, 200);
    assert.equal((await request(h.app).post("/api/auth/login").send({ email: user.email, password: "another-pass" })).status, 200);
  });

  it("public profiles show listings but never email or credits", async () => {
    const { user } = await h.createUser({ name: "Mei" });
    await h.createListing(user._id);
    await h.createListing(user._id, { title: "Removed one", isActive: false });

    const res = await request(h.app).get(`/api/users/${user._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, "Mei");
    assert.equal(res.body.user.email, undefined);
    assert.equal(res.body.user.timeCredits, undefined);
    assert.equal(res.body.listings.length, 1);

    assert.equal((await request(h.app).get(`/api/users/${"a".repeat(24)}`)).status, 404);
    assert.equal((await request(h.app).get("/api/users/not-an-id")).status, 400);
  });
});
