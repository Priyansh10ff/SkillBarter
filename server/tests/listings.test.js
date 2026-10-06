const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");

describe("listings", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(h.clearDb);

  const listing = { title: "Guitar basics", description: "Chords, strumming and one full song.", category: "Music", duration: 30 };

  it("creates a listing with a credit cost based on duration", async () => {
    const { auth } = await h.createUser();
    const res = await request(h.app).post("/api/listings").set(auth).send(listing);
    assert.equal(res.status, 201);
    assert.equal(res.body.creditCost, 0.5);
  });

  it("validates category and duration", async () => {
    const { auth } = await h.createUser();
    assert.equal((await request(h.app).post("/api/listings").set(auth).send({ ...listing, duration: 45 })).status, 400);
    assert.equal((await request(h.app).post("/api/listings").set(auth).send({ ...listing, category: "Cooking" })).status, 400);
    assert.equal((await request(h.app).post("/api/listings").send(listing)).status, 401);
  });

  it("only the owner can remove a listing, and removed listings disappear", async () => {
    const owner = await h.createUser();
    const other = await h.createUser();
    const { body } = await request(h.app).post("/api/listings").set(owner.auth).send(listing);

    assert.equal((await request(h.app).delete(`/api/listings/${body._id}`).set(other.auth)).status, 403);
    assert.equal((await request(h.app).delete(`/api/listings/${body._id}`).set(owner.auth)).status, 200);

    assert.equal((await request(h.app).get("/api/listings")).body.length, 0);
    assert.equal((await request(h.app).get(`/api/listings/${body._id}`)).status, 404);
    assert.equal((await request(h.app).get("/api/listings/not-an-id")).status, 400);
  });
});
