const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const h = require("./helpers");

describe("listings", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(h.clearDb);

  const listing = { title: "Guitar basics", description: "Chords, strumming and one full song.", category: "Music", duration: 30, tags: ["Guitar", "guitar"] };

  it("creates a listing with a credit cost based on duration and clean tags", async () => {
    const { auth } = await h.createUser();
    const res = await request(h.app).post("/api/listings").set(auth).send(listing);
    assert.equal(res.status, 201);
    assert.equal(res.body.creditCost, 0.5);
    assert.deepEqual(res.body.tags, ["guitar"]);
  });

  it("validates category and duration", async () => {
    const { auth } = await h.createUser();
    assert.equal((await request(h.app).post("/api/listings").set(auth).send({ ...listing, duration: 45 })).status, 400);
    assert.equal((await request(h.app).post("/api/listings").set(auth).send({ ...listing, category: "Cooking" })).status, 400);
    assert.equal((await request(h.app).post("/api/listings").send(listing)).status, 401);
  });

  it("searches by text and category, with pagination", async () => {
    const { user } = await h.createUser();
    await h.createListing(user._id, { title: "Intro to React", category: "Coding" });
    await h.createListing(user._id, { title: "Spanish chat", category: "Language", tags: ["spanish"] });
    await h.createListing(user._id, { title: "Advanced hooks", description: "Deep dive into React hooks and context.", category: "Coding" });
    await h.createListing(user._id, { title: "Hidden", isActive: false });

    const all = await request(h.app).get("/api/listings");
    assert.equal(all.body.total, 3);

    const react = await request(h.app).get("/api/listings").query({ q: "react" });
    assert.deepEqual(react.body.items.map((l) => l.title).sort(), ["Advanced hooks", "Intro to React"]);

    const lang = await request(h.app).get("/api/listings").query({ category: "Language" });
    assert.equal(lang.body.items[0].title, "Spanish chat");

    // regex characters in the query are treated literally
    assert.equal((await request(h.app).get("/api/listings").query({ q: "(.*" })).body.total, 0);

    const page2 = await request(h.app).get("/api/listings").query({ limit: 2, page: 2 });
    assert.equal(page2.body.items.length, 1);
    assert.equal(page2.body.totalPages, 2);

    assert.equal((await request(h.app).get("/api/listings").query({ category: "Nope" })).status, 400);
  });

  it("detail includes the teacher and more of their listings", async () => {
    const { user } = await h.createUser({ name: "Mei" });
    const a = await h.createListing(user._id, { title: "First" });
    await h.createListing(user._id, { title: "Second" });

    const res = await request(h.app).get(`/api/listings/${a._id}`);
    assert.equal(res.body.listing.teacher.name, "Mei");
    assert.equal(res.body.listing.teacher.email, undefined);
    assert.deepEqual(res.body.more.map((l) => l.title), ["Second"]);
  });

  it("only the owner can edit; bookings keep the original snapshot", async () => {
    const owner = await h.createUser();
    const learner = await h.createUser();
    const { body: created } = await request(h.app).post("/api/listings").set(owner.auth).send(listing);
    const { body: booking } = await request(h.app).post("/api/bookings").set(learner.auth).send({ listingId: created._id });

    assert.equal((await request(h.app).put(`/api/listings/${created._id}`).set(learner.auth).send({ title: "Mine now" })).status, 403);
    assert.equal((await request(h.app).put(`/api/listings/${created._id}`).set(owner.auth).send({})).status, 400);
    assert.equal((await request(h.app).put(`/api/listings/${created._id}`).set(owner.auth).send({ duration: 45 })).status, 400);

    const edited = await request(h.app).put(`/api/listings/${created._id}`).set(owner.auth).send({ title: "Guitar for beginners", duration: 60 });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.creditCost, 1);

    const after = await request(h.app).get(`/api/bookings/${booking._id}`).set(learner.auth);
    assert.equal(after.body.listingSnapshot.title, "Guitar basics");
    assert.equal(after.body.creditCost, 0.5);
    await h.assertLedgerConsistent();
  });

  it("only the owner can remove a listing, and removed listings disappear", async () => {
    const owner = await h.createUser();
    const other = await h.createUser();
    const { body } = await request(h.app).post("/api/listings").set(owner.auth).send(listing);

    assert.equal((await request(h.app).delete(`/api/listings/${body._id}`).set(other.auth)).status, 403);
    assert.equal((await request(h.app).delete(`/api/listings/${body._id}`).set(owner.auth)).status, 200);

    assert.equal((await request(h.app).get("/api/listings")).body.total, 0);
    assert.equal((await request(h.app).get(`/api/listings/${body._id}`)).status, 404);
    assert.equal((await request(h.app).get("/api/listings/not-an-id")).status, 400);
  });
});

describe("matching", () => {
  before(h.startDb);
  after(h.stopDb);
  beforeEach(h.clearDb);

  const setSkills = (user, offered, requested) =>
    h.models.User.updateOne({ _id: user._id }, { skillsOffered: offered, skillsRequested: requested });

  it("suggests listings that teach what you want, never your own", async () => {
    const me = await h.createUser();
    const arjun = await h.createUser();
    await setSkills(me.user, ["react"], ["guitar", "system design"]);
    await h.createListing(arjun.user._id, { title: "Guitar: first chords", category: "Music" });
    await h.createListing(arjun.user._id, { title: "Mock interview", category: "Career", tags: ["system design"] });
    await h.createListing(arjun.user._id, { title: "Guitarist's guide to nothing" }); // not the whole word
    await h.createListing(me.user._id, { title: "Guitar again", category: "Music" });

    const res = await request(h.app).get("/api/listings/suggested").set(me.auth);
    assert.deepEqual(res.body.map((l) => l.title).sort(), ["Guitar: first chords", "Mock interview"]);
  });

  it("finds two-way barter matches only", async () => {
    const me = await h.createUser({ name: "Me" });
    const swap = await h.createUser({ name: "Swap" });
    const oneWay = await h.createUser({ name: "One way" });
    const unverified = await h.createUser({ name: "Unverified", verified: false });
    await setSkills(me.user, ["react", "chess"], ["guitar"]);
    await setSkills(swap.user, ["guitar", "piano"], ["react"]);
    await setSkills(oneWay.user, ["guitar"], ["figma"]);
    await setSkills(unverified.user, ["guitar"], ["react"]);

    const res = await request(h.app).get("/api/users/matches").set(me.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].user.name, "Swap");
    assert.deepEqual(res.body[0].theyTeach, ["guitar"]);
    assert.deepEqual(res.body[0].theyWant, ["react"]);
    assert.equal(res.body[0].user.email, undefined);
  });
});
