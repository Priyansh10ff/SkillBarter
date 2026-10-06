const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const request = require("supertest");
const { io: connect } = require("socket.io-client");
const h = require("./helpers");
const initSockets = require("../sockets");
const { setIO } = require("../services/realtime");
const { outbox } = require("../services/emailService");
const Notification = require("../models/Notification");

const inHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("notifications, chat and sockets", () => {
  let server;
  let url;
  let teacher;
  let learner;
  let listing;

  before(async () => {
    await h.startDb();
    server = http.createServer(h.app);
    setIO(initSockets(server));
    await new Promise((resolve) => server.listen(0, resolve));
    url = `http://localhost:${server.address().port}`;
  });
  after(async () => {
    setIO(null);
    await new Promise((resolve) => server.close(resolve));
    await h.stopDb();
  });
  beforeEach(async () => {
    await h.clearDb();
    outbox.length = 0;
    teacher = await h.createUser({ name: "Teacher" });
    learner = await h.createUser({ name: "Learner" });
    listing = await h.createListing(teacher.user._id, { title: "Guitar basics" });
  });

  const book = () => request(h.app).post("/api/bookings").set(learner.auth).send({ listingId: String(listing._id) });
  const act = (who, id, action, body = {}) => request(h.app).post(`/api/bookings/${id}/${action}`).set(who.auth).send(body);

  it("booking notifies and emails the teacher; scheduling notifies the proposer", async () => {
    const { body: booking } = await book();

    const list = await request(h.app).get("/api/notifications").set(teacher.auth);
    assert.equal(list.body.unread, 1);
    assert.match(list.body.items[0].message, /Learner booked “Guitar basics”/);
    assert.equal(list.body.items[0].link, `/bookings#${booking._id}`);
    assert.equal(outbox.filter((m) => m.to === teacher.user.email).length, 1);

    await act(learner, booking._id, "propose", { date: inHours(24) });
    await act(teacher, booking._id, "accept");
    const learnerList = await request(h.app).get("/api/notifications").set(learner.auth);
    assert.equal(learnerList.body.items[0].type, "booking.scheduled");
  });

  it("only the owner can mark a notification read", async () => {
    const { body: booking } = await book();
    const { body } = await request(h.app).get("/api/notifications").set(teacher.auth);
    const id = body.items[0]._id;

    assert.equal((await request(h.app).put(`/api/notifications/${id}/read`).set(learner.auth)).status, 404);
    assert.equal((await request(h.app).put(`/api/notifications/${id}/read`).set(teacher.auth)).body.read, true);
    assert.equal((await Notification.findById(id)).read, true);

    await act(learner, booking._id, "cancel"); // a second notification for the teacher
    assert.equal((await request(h.app).get("/api/notifications").set(teacher.auth)).body.unread, 1);
    await request(h.app).put("/api/notifications/read-all").set(teacher.auth);
    assert.equal((await request(h.app).get("/api/notifications").set(teacher.auth)).body.unread, 0);
  });

  it("booking chat is private to the two participants", async () => {
    const { body: booking } = await book();
    const outsider = await h.createUser();

    assert.equal((await request(h.app).post(`/api/bookings/${booking._id}/messages`).set(learner.auth).send({ body: "  " })).status, 400);
    assert.equal((await request(h.app).post(`/api/bookings/${booking._id}/messages`).set(learner.auth).send({ body: "Hi! Saturday?" })).status, 201);
    assert.equal((await request(h.app).post(`/api/bookings/${booking._id}/messages`).set(teacher.auth).send({ body: "Works for me" })).status, 201);

    const msgs = await request(h.app).get(`/api/bookings/${booking._id}/messages`).set(teacher.auth);
    assert.deepEqual(msgs.body.map((m) => `${m.sender.name}: ${m.body}`), ["Learner: Hi! Saturday?", "Teacher: Works for me"]);

    assert.equal((await request(h.app).get(`/api/bookings/${booking._id}/messages`).set(outsider.auth)).status, 404);
    assert.equal((await request(h.app).post(`/api/bookings/${booking._id}/messages`).set(outsider.auth).send({ body: "hey" })).status, 404);
  });

  it("sockets need a valid token and receive live events in their own room", async () => {
    const rejected = connect(url, { auth: { token: "junk" }, transports: ["websocket"], reconnection: false });
    const err = await new Promise((resolve) => rejected.on("connect_error", resolve));
    assert.equal(err.message, "unauthorized");
    rejected.close();

    const teacherSocket = connect(url, { auth: { token: teacher.token }, transports: ["websocket"], reconnection: false });
    const learnerSocket = connect(url, { auth: { token: learner.token }, transports: ["websocket"], reconnection: false });
    await Promise.all([teacherSocket, learnerSocket].map((s) => new Promise((resolve) => s.on("connect", resolve))));

    const learnerGot = [];
    learnerSocket.on("notification", (n) => learnerGot.push(n));
    const teacherNotification = new Promise((resolve) => teacherSocket.on("notification", resolve));
    const learnerBalance = new Promise((resolve) => learnerSocket.on("credits:update", resolve));

    await book();
    assert.match((await teacherNotification).message, /booked/);
    assert.deepEqual(await learnerBalance, { timeCredits: 1 });
    assert.equal(learnerGot.length, 0); // the learner's own booking doesn't notify them

    teacherSocket.close();
    learnerSocket.close();
  });

  it("only participants of a scheduled booking can join its session room", async () => {
    const { body: booking } = await book();
    const outsider = await h.createUser();
    const socket = connect(url, { auth: { token: outsider.token }, transports: ["websocket"], reconnection: false });
    await new Promise((resolve) => socket.on("connect", resolve));

    const denied = new Promise((resolve) => socket.on("room:denied", resolve));
    socket.emit("join_room", booking._id);
    assert.equal((await denied).bookingId, booking._id);
    socket.close();
  });
});
