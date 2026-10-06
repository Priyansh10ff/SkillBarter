const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const request = require("supertest");
const { io: connect } = require("socket.io-client");
const h = require("./helpers");
const initSockets = require("../sockets");
const { setIO } = require("../services/realtime");

const inHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const stroke = { color: "#ECEAE3", width: 3, points: [[0.1, 0.1], [0.2, 0.25]] };

describe("session room", () => {
  let server;
  let io;
  let url;
  let teacher;
  let learner;
  let bookingId;
  const sockets = [];

  const open = async (who) => {
    const s = connect(url, { auth: { token: who.token }, transports: ["websocket"], reconnection: false });
    sockets.push(s);
    await new Promise((resolve, reject) => {
      s.on("connect", resolve);
      s.on("connect_error", reject);
    });
    return s;
  };
  const join = (s, id = bookingId) => new Promise((resolve) => s.emit("room:join", { bookingId: id }, resolve));
  const next = (s, event) => new Promise((resolve) => s.once(event, resolve));

  before(async () => {
    await h.startDb();
    server = http.createServer(h.app);
    io = initSockets(server);
    setIO(io);
    await new Promise((resolve) => server.listen(0, resolve));
    url = `http://localhost:${server.address().port}`;
  });
  after(async () => {
    // open client sockets keep server.close() waiting forever, so close them first
    sockets.splice(0).forEach((s) => s.close());
    setIO(null);
    await new Promise((resolve) => io.close(() => resolve())); // also closes the http server
    server.closeAllConnections();
    await h.stopDb();
  });
  beforeEach(async () => {
    sockets.splice(0).forEach((s) => s.close());
    await h.clearDb();
    teacher = await h.createUser({ name: "Teacher" });
    learner = await h.createUser({ name: "Learner" });
    const listing = await h.createListing(teacher.user._id);
    const { body } = await request(h.app).post("/api/bookings").set(learner.auth).send({ listingId: String(listing._id), proposedDate: inHours(24) });
    bookingId = body._id;
    await request(h.app).post(`/api/bookings/${bookingId}/accept`).set(teacher.auth);
  });

  const roomInfo = (who) => request(h.app).get(`/api/bookings/${bookingId}/room`).set(who.auth);

  it("opens 15 minutes before the start, for participants only", async () => {
    const early = await roomInfo(learner);
    assert.equal(early.status, 400);
    assert.equal(early.body.code, "ROOM_NOT_OPEN");

    await h.startSessionAgo(bookingId, 5);
    const outsider = await h.createUser();
    assert.equal((await roomInfo(outsider)).status, 404);

    const l = await roomInfo(learner);
    const t = await roomInfo(teacher);
    assert.equal(l.status, 200);
    assert.equal(l.body.role, "learner");
    assert.equal(t.body.role, "teacher");
    // each side's own peer ID is the other side's target, and IDs aren't guessable
    assert.equal(l.body.me.peerId, t.body.other.peerId);
    assert.equal(l.body.other.peerId, t.body.me.peerId);
    assert.notEqual(l.body.me.peerId, `${bookingId}-learner`);
    assert.equal(l.body.other.name, "Teacher");
    assert.ok(l.body.iceServers.length >= 1);
  });

  it("closes once the booking isn't scheduled any more", async () => {
    await h.startSessionAgo(bookingId, 5);
    await request(h.app).post(`/api/bookings/${bookingId}/complete`).set(learner.auth);
    const res = await roomInfo(learner);
    assert.equal(res.body.code, "ROOM_NOT_SCHEDULED");
  });

  it("socket join follows the same rules and reports who is already there", async () => {
    const ls = await open(learner);
    assert.equal((await join(ls)).ok, false); // too early

    await h.startSessionAgo(bookingId, 5);
    const outsiderSocket = await open(await h.createUser());
    assert.equal((await join(outsiderSocket)).ok, false);

    const first = await join(ls);
    assert.equal(first.ok, true);
    assert.deepEqual(first.others, []);

    const ts = await open(teacher);
    const announced = next(ls, "room:peer-joined");
    const second = await join(ts);
    assert.deepEqual(second.others, [String(learner.user._id)]);
    assert.equal((await announced).userId, String(teacher.user._id));

    const left = next(ls, "room:peer-left");
    ts.close();
    assert.equal((await left).userId, String(teacher.user._id));
  });

  it("relays valid whiteboard strokes, replays them to late joiners, and clears", async () => {
    await h.startSessionAgo(bookingId, 5);
    const ls = await open(learner);
    const ts = await open(teacher);
    await join(ls);
    await join(ts);

    const received = next(ts, "wb:stroke");
    ls.emit("wb:stroke", { bookingId, stroke: { ...stroke, color: "javascript:alert(1)" } }); // dropped
    ls.emit("wb:stroke", { bookingId, stroke: { ...stroke, points: [[5, 5]] } }); // out of range, dropped
    ls.emit("wb:stroke", { bookingId, stroke });
    assert.deepEqual(await received, stroke);

    // the learner reconnects and gets the board back
    ls.close();
    const again = await open(learner);
    const rejoin = await join(again);
    assert.equal(rejoin.strokes.length, 1);

    const cleared = next(ts, "wb:clear");
    again.emit("wb:clear", { bookingId });
    await cleared;
    const third = await open(learner);
    assert.equal((await join(third)).strokes.length, 0);
  });

  it("ignores whiteboard events from sockets that never joined", async () => {
    await h.startSessionAgo(bookingId, 5);
    const ts = await open(teacher);
    await join(ts);
    const outsiderSocket = await open(await h.createUser());
    let got = false;
    ts.on("wb:stroke", () => (got = true));
    outsiderSocket.emit("wb:stroke", { bookingId, stroke });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(got, false);
  });
});
