const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");
const { outbox } = require("../services/emailService");

const linkToken = (kind) => {
  const mail = outbox.findLast((m) => m.text.includes(`/${kind}/`));
  return mail.text.match(new RegExp(`${kind}/([a-f0-9]{64})`))[1];
};

describe("auth", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(async () => {
    await h.clearDb();
    outbox.length = 0;
  });

  const body = { name: "Asha", email: "Asha@Example.com", password: "password123", skills: ["React", "react", "Guitar"] };
  const creds = { email: body.email, password: body.password };
  const post = (path, data) => request(h.app).post(`/api/auth${path}`).send(data);

  it("registers with 2 welcome credits, saves skills and sends a verification email", async () => {
    const res = await post("/register", body);
    assert.equal(res.status, 201);

    const user = await h.models.User.findOne({ email: "asha@example.com" });
    assert.equal(user.timeCredits, 2);
    assert.deepEqual(user.skillsOffered, ["react", "guitar"]);
    assert.equal(user.isVerified, false);
    assert.equal(outbox.length, 1);
    await h.assertLedgerConsistent();
  });

  it("rejects duplicates, disposable domains and bad input", async () => {
    await post("/register", body);
    assert.equal((await post("/register", body)).status, 409);
    assert.equal((await post("/register", { ...body, email: "x@mailinator.com" })).status, 400);

    const bad = await post("/register", { name: "A", email: "nope", password: "short" });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.details.length >= 3);
  });

  it("blocks login until verified, with a code the client can act on", async () => {
    await post("/register", body);
    const blocked = await post("/login", creds);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, "EMAIL_UNVERIFIED");

    const verify = await request(h.app).get(`/api/auth/verify-email/${linkToken("verify-email")}`);
    assert.equal(verify.status, 200);
    assert.ok(verify.body.token);

    const login = await post("/login", creds);
    assert.equal(login.status, 200);
    assert.equal(login.body.user.password, undefined);

    const me = await request(h.app).get("/api/users/me").set("Authorization", `Bearer ${login.body.token}`);
    assert.equal(me.body.email, "asha@example.com");
  });

  it("verification links work once; resend issues a new one", async () => {
    await post("/register", body);
    const first = linkToken("verify-email");

    const resend = await post("/resend-verification", { email: body.email });
    assert.equal(resend.status, 200);
    const second = linkToken("verify-email");
    assert.notEqual(first, second);

    // the old link stops working once a new one is issued
    assert.equal((await request(h.app).get(`/api/auth/verify-email/${first}`)).status, 400);
    assert.equal((await request(h.app).get(`/api/auth/verify-email/${second}`)).status, 200);
    assert.equal((await request(h.app).get(`/api/auth/verify-email/${second}`)).status, 400);
  });

  it("forgot/resend give the same answer whether or not the account exists", async () => {
    const known = await h.createUser();
    const a = await post("/forgot-password", { email: known.user.email });
    const b = await post("/forgot-password", { email: "nobody@example.com" });
    assert.equal(a.status, 200);
    assert.deepEqual(a.body, b.body);
    assert.equal(outbox.length, 1);

    const c = await post("/resend-verification", { email: "nobody@example.com" });
    assert.deepEqual(c.body, a.body);
  });

  it("resets the password once, logs out old sessions and verifies the email", async () => {
    await post("/register", body); // unverified
    const user = await h.models.User.findOne({ email: "asha@example.com" });
    const oldToken = require("../utils/tokens").signToken(user._id);
    await new Promise((r) => setTimeout(r, 1100)); // iat has 1s resolution

    await post("/forgot-password", { email: body.email });
    const token = linkToken("reset-password");

    assert.equal((await post(`/reset-password/${token}`, { password: "short" })).status, 400);
    const reset = await post(`/reset-password/${token}`, { password: "new-password-1" });
    assert.equal(reset.status, 200);
    assert.ok(reset.body.token);

    assert.equal((await post(`/reset-password/${token}`, { password: "new-password-2" })).status, 400);
    assert.equal((await post("/login", creds)).status, 401);
    assert.equal((await post("/login", { email: body.email, password: "new-password-1" })).status, 200);

    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", `Bearer ${oldToken}`)).status, 401);
    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", `Bearer ${reset.body.token}`)).status, 200);
  });

  it("rejects wrong passwords and bad tokens", async () => {
    const { user } = await h.createUser();
    assert.equal((await post("/login", { email: user.email, password: "wrong-pass" })).status, 401);
    assert.equal((await request(h.app).get("/api/users/me")).status, 401);
    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", "Bearer junk")).status, 401);
  });
});
