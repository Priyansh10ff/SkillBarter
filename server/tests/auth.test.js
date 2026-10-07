const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");

describe("auth", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(h.clearDb);

  const body = { name: "Asha", email: "Asha@Example.com", password: "password123", skills: ["React", "react", "Guitar"] };
  const creds = { email: body.email, password: body.password };
  const post = (path, data) => request(h.app).post(`/api/auth${path}`).send(data);
  const me = (token) => request(h.app).get("/api/users/me").set("Authorization", `Bearer ${token}`);

  it("registers with 2 welcome credits, saves skills and logs straight in", async () => {
    const res = await post("/register", body);
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.timeCredits, 2);

    const user = await h.models.User.findOne({ email: "asha@example.com" });
    assert.deepEqual(user.skillsOffered, ["react", "guitar"]);
    assert.equal((await me(res.body.token)).body.email, "asha@example.com");
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

  it("logs in with the right password and hides it from the response", async () => {
    await post("/register", body);
    const login = await post("/login", creds);
    assert.equal(login.status, 200);
    assert.equal(login.body.user.password, undefined);
    assert.equal((await me(login.body.token)).body.email, "asha@example.com");
  });

  it("rejects wrong passwords and bad tokens", async () => {
    const { user } = await h.createUser();
    assert.equal((await post("/login", { email: user.email, password: "wrong-pass" })).status, 401);
    assert.equal((await post("/login", { email: "nobody@example.com", password: "password123" })).status, 401);
    assert.equal((await request(h.app).get("/api/users/me")).status, 401);
    assert.equal((await request(h.app).get("/api/users/me").set("Authorization", "Bearer junk")).status, 401);
  });
});
