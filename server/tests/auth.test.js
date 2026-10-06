const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");
const { outbox } = require("../services/emailService");

const tokenFromLastEmail = () => outbox.at(-1).text.match(/verify-email\/([a-f0-9]{64})/)[1];

describe("auth", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(async () => {
    await h.clearDb();
    outbox.length = 0;
  });

  const body = { name: "Asha", email: "Asha@Example.com", password: "password123", skills: ["React", "react", "Guitar"] };

  it("registers with 2 welcome credits, saves skills and sends a verification email", async () => {
    const res = await request(h.app).post("/api/users").send(body);
    assert.equal(res.status, 201);

    const user = await h.models.User.findOne({ email: "asha@example.com" });
    assert.equal(user.timeCredits, 2);
    assert.deepEqual(user.skillsOffered, ["react", "guitar"]);
    assert.equal(user.isVerified, false);
    assert.equal(outbox.length, 1);
    await h.assertLedgerConsistent();
  });

  it("rejects duplicates, disposable domains and bad input", async () => {
    await request(h.app).post("/api/users").send(body);
    assert.equal((await request(h.app).post("/api/users").send(body)).status, 409);
    assert.equal((await request(h.app).post("/api/users").send({ ...body, email: "x@mailinator.com" })).status, 400);

    const bad = await request(h.app).post("/api/users").send({ name: "A", email: "nope", password: "short" });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.details.length >= 3);
  });

  it("blocks login until verified, then logs in", async () => {
    await request(h.app).post("/api/users").send(body);
    const creds = { email: body.email, password: body.password };

    assert.equal((await request(h.app).post("/api/users/login").send(creds)).status, 403);

    const verify = await request(h.app).get(`/api/users/verify-email/${tokenFromLastEmail()}`);
    assert.equal(verify.status, 200);
    assert.ok(verify.body.token);

    const login = await request(h.app).post("/api/users/login").send(creds);
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    assert.equal(login.body.user.password, undefined);

    const me = await request(h.app).get("/api/users/me").set("Authorization", `Bearer ${login.body.token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.email, "asha@example.com");
  });

  it("verification links work once", async () => {
    await request(h.app).post("/api/users").send(body);
    const token = tokenFromLastEmail();
    assert.equal((await request(h.app).get(`/api/users/verify-email/${token}`)).status, 200);
    assert.equal((await request(h.app).get(`/api/users/verify-email/${token}`)).status, 400);
  });

  it("rejects wrong passwords and bad tokens", async () => {
    const { user } = await h.createUser();
    assert.equal((await request(h.app).post("/api/users/login").send({ email: user.email, password: "wrong-pass" })).status, 401);
    assert.equal((await request(h.app).get("/api/users/me")).status, 401);
    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", "Bearer junk")).status, 401);
  });

  it("updates the profile with validated fields only", async () => {
    const { auth } = await h.createUser();
    const res = await request(h.app)
      .put("/api/users/profile")
      .set(auth)
      .send({ bio: "Hi", skillsRequested: ["Figma"], timezone: "Asia/Kolkata", timeCredits: 999, role: "admin" });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.skillsRequested, ["figma"]);
    assert.equal(res.body.timeCredits, 2);
    assert.equal(res.body.role, "user");

    assert.equal((await request(h.app).put("/api/users/profile").set(auth).send({ timezone: "Mars/Base" })).status, 400);
  });
});
