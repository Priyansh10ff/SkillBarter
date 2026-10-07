# Skill Barter: Product Requirements Document

| | |
|---|---|
| **Product** | Skill Barter web app |
| **Owner** | Priyansh Dugar |
| **Status** | v1.0 live, v1.1 planned |
| **Live** | [skillbarter-web.vercel.app](https://skillbarter-web.vercel.app) |
| **Last updated** | October 2026 |

Related: [PRODUCT.md](./PRODUCT.md) (overview) · [TECHNICAL.md](./TECHNICAL.md) (implementation) · [DESIGN.md](./DESIGN.md) (interface)

---

## 1. Problem

Students and early-career people want to learn things their courses don't cover, like a new framework, design, a language or an instrument. Paid courses and tutors are priced for people with an income. At the same time, almost everyone already knows something worth teaching.

Free peer help exists in Discord servers and group chats, but it isn't reciprocal. The same few people do all the teaching and burn out. Finding someone who will trade fairly, agreeing on a time, sharing a call link, sketching on a whiteboard and confirming the session happened usually takes four different apps.

Skill Barter makes the exchange two-sided and keeps it in one place. You give an hour, you get an hour, and the whole session happens inside the app.

## 2. Goals

| # | Goal | How we know |
|---|---|---|
| G1 | A new member can book their first session within 5 minutes of signing up | Timed walkthrough: sign up → onboarding → book |
| G2 | Credits are never created, lost or paid twice | Ledger invariants hold after every test and in production checks (section 7) |
| G3 | Two people can meet, talk, share a screen and draw together without leaving the app | Room smoke test on Chrome, Safari and Firefox |
| G4 | A teacher is always paid for a session that happened, even if the learner disappears | Auto-release 48 hours after the end, covered by tests |
| G5 | The whole product runs at zero hosting cost to start | Vercel Hobby, Render free, Atlas M0 |

## 3. Non-goals

- Money of any kind: buying, selling, cashing out or tipping credits
- Group classes or webinars (sessions are 1:1)
- Recording sessions
- Native mobile apps (the responsive web app is the mobile experience)
- Calendar sync with Google or Outlook
- Certificates or accredited courses

## 4. Users

| Persona | Description | Main needs |
|---|---|---|
| **Asha, CS student** | 20, good at React, wants to learn guitar. Free most evenings | Find a guitar teacher who wants React help, and trade without paying |
| **Kabir, early-career engineer** | 25, runs mock interviews, wants to practise public speaking | Short, focused 1:1s with a clear time, and a teaching record he can show |
| **Lucía, language tutor at heart** | 30, native Spanish speaker, in another timezone | Times shown in her timezone, regular learners, reviews that build trust |
| **Admin** | Runs the community | See reported sessions and decide fairly where the held credits go |

## 5. User stories and acceptance criteria

### Accounts and onboarding

**A1. As a new member, I can sign up and start straight away.**
- Name (2 to 60 characters), email and password (8 to 72 characters) are required. Skills I can teach are optional.
- The email is trimmed and lowercased. Registering an email that already exists returns "An account with this email already exists".
- Disposable email domains (for example `mailinator.com`) are rejected.
- On success I'm logged in, I have exactly 2 credits with a `SIGNUP_BONUS` ledger entry, and I land on onboarding.

**A2. As a new member, I'm walked through 3 setup steps:** what I can teach, what I want to learn, and when I'm usually around. I can skip ("Do this later") and finish from Settings.

**A3. As a member, I can log in and out.**
- A wrong email or password shows one generic message ("Wrong email or password").
- Sessions last 7 days. An expired session logs me out with a notice and doesn't leave a broken page.

**A4. As a member, I can change my password in Settings.** The current password is required. Every other logged-in session is signed out, and this one stays signed in.

**A5. As a member, I have a public profile** with name, bio, skills offered and wanted, availability, rating, reviews, badges, session stats and active listings. It never shows my email or balance.

### Listings and discovery

**L1. As a teacher, I can post a session** with a title (3 to 100 characters), description (10 to 2000), a category (Coding, Design, Music, Language, Academics, Career, Lifestyle, Other), up to 8 tags and a length of 30, 60, 90 or 120 minutes. The cost is shown as time: 1 credit per hour.

**L2. As a teacher, I can edit or remove my listing.** Bookings that already exist keep the title, length and cost they were booked at. Removed listings can't be booked.

**L3. As a learner, I can search and filter** by keyword (title, description and tags), by category, and page through the results.

**L4. As a learner, I see suggested sessions** that match what I want to learn, and **barter matches**: members who teach something I want *and* want something I teach.

### Booking and scheduling

**B1. As a learner, I can book a session.**
- I can't book my own listing, and I can't book a removed one.
- My balance must cover the cost. If it doesn't, I see "Not enough credits".
- On success the cost leaves my available balance and shows as *held* in my wallet. The teacher is notified.

**B2. Either of us can propose a time, and only the other person can accept it.**
- A proposed time must be at least 5 minutes ahead and within 90 days.
- Times are shown in each viewer's own timezone.
- Accepting a time that has already passed is refused ("Propose a new one").

**B3. We can chat on the booking** before and after the session (1 to 1000 characters per message).

**B4. Either of us can cancel before the session starts** (the teacher declining a pending booking counts as a cancel). The learner gets the full cost back.

### Session room

**R1. Only the learner and teacher can enter**, and only from 15 minutes before the start until 3 hours after the end. Outside that window the room says when it opens or that it has closed.

**R2. In the room we have** video and audio with mute and camera toggles, screen share, a shared whiteboard (colours, clear) and chat. The chat is the same thread as the booking chat.

**R3. If I have no camera or microphone**, I can still join to watch, draw and chat.

**R4. Leaving the room turns the camera off.**

### Settlement

**S1. As the learner, I can confirm the session** once it has started. The teacher receives the held credits, both session counts go up, and any new badges are awarded.

**S2. If nobody confirms**, the credits release to the teacher automatically 48 hours after the scheduled end.

**S3. As the learner, I can report a problem** after the start and before auto-release. The credits stay frozen and the teacher is notified.

**S4. As an admin, I can resolve a report** by either releasing the credits to the teacher or refunding them to the learner. Both people are notified.

**S5. No action can pay or refund twice**, however many times it's clicked or retried.

### Reviews, badges and leaderboard

**V1. After a completed session, each side can leave one review** with a 1 to 5 rating and a comment of up to 500 characters. A second attempt returns "You've already reviewed this session".

**V2. Badges are awarded automatically:** First lesson, Taught ×5 / ×10 / ×25, Learned ×5 / ×10, Both sides, and Well rated (4.5+ from 5 or more reviews).

**V3. The leaderboard** shows the top 20 by sessions taught, or by rating among members with at least 3 reviews.

### Wallet and notifications

**W1. My wallet shows** my available balance, the credits held in open bookings, a balance chart, and every ledger entry with its type and balance afterwards.

**N1. I get live notifications** for new bookings, proposed and accepted times, cancellations, credits received, reports and their outcomes, and new badges. A bell shows the unread count, and I can mark one or all as read.

## 6. Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR1 | Email and password auth with JWT (7 days), sign-up logs straight in | Must | Done |
| FR2 | 2-credit signup bonus recorded in the ledger | Must | Done |
| FR3 | Onboarding: teach, learn, availability | Should | Done |
| FR4 | Profile editing and public profiles | Must | Done |
| FR5 | Password change that signs out other sessions | Should | Done |
| FR6 | Listing CRUD with category, tags and durations | Must | Done |
| FR7 | Full-text search, category filter, pagination | Must | Done |
| FR8 | Suggested listings and two-way barter matches | Should | Done |
| FR9 | Booking with credit hold, propose / accept scheduling | Must | Done |
| FR10 | Cancel and decline with refund | Must | Done |
| FR11 | Per-booking chat | Should | Done |
| FR12 | Session room: video, audio, screen share, whiteboard, chat, access window | Must | Done |
| FR13 | Learner confirmation releases credits | Must | Done |
| FR14 | Auto-release 48 hours after the end | Must | Done |
| FR15 | Report a problem and admin resolution (API) | Must | Done |
| FR16 | Reviews, running rating average, badges, leaderboard | Should | Done |
| FR17 | Wallet with held credits, chart and ledger history | Must | Done |
| FR18 | Real-time notifications, balance and booking updates | Should | Done |
| FR19 | Landing page with live sessions board and community numbers | Should | Done |
| FR20 | Health endpoint for hosting and uptime checks | Should | Done |
| FR21 | Admin screen for reported sessions | Should | **Open** (v1.1) |
| FR22 | Transactional email over an HTTPS provider (password reset, booking alerts) | Should | **Open** (v1.1) |
| FR23 | Google sign-in | Could | Open (v1.2) |
| FR24 | Report or block a member, and hide a listing | Should | Open (v1.2) |
| FR25 | Calendar invite (.ics) for scheduled sessions | Could | Open (v1.2) |

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| **Credit integrity** | Every credit movement is one MongoDB transaction covering booking, balance and ledger. Status transitions are conditional updates. Balances can never go below 0. For every user, the ledger entries add up to their balance. Total balances plus held credits equals total granted. |
| **Security** | bcrypt password hashes (cost 10) never leave the server. Every write is validated with zod and unknown fields are stripped. Ownership and participation are checked on the server for every booking, chat, room and review. CORS and sockets accept only `CLIENT_URL` in production. `helmet` headers. Rate limits are 20 requests per 15 minutes on auth and 300 per 15 minutes on the rest of the API. 100 kB body limit. |
| **Privacy** | Public profiles and matches never include email or balance. Rooms, chats and bookings are visible only to their two participants. Notifications are deleted after 90 days. |
| **Reliability** | The server only listens once MongoDB is connected. `/health` reports database state. Graceful shutdown on `SIGTERM`. The auto-release job runs on boot and every 10 minutes, so a server that slept catches up. |
| **Real-time** | Socket connections are authenticated with the JWT in the handshake. Each user gets a private room. Whiteboard strokes are validated (palette colours, at most 500 points). |
| **Accessibility** | WCAG AA text contrast on every surface, checked with axe-core. Visible focus everywhere, labelled form fields, `role="alert"` errors, native `<dialog>`, and `prefers-reduced-motion` respected. |
| **Performance** | Each route is its own lazy-loaded chunk. Search is debounced. Landing stats are cached for 60 seconds. Static assets are served with an immutable cache. |
| **Compatibility** | Latest two versions of Chrome, Edge, Firefox and Safari. Layouts work from 360 px to wide desktop. |
| **Maintainability** | API tests cover auth, listings, bookings, concurrency, rooms, reviews, notifications and seed data. Client lint and build must pass. Configuration comes only from environment variables, and no secrets are in the repo. |

## 8. Success metrics

| Metric | Target |
|---|---|
| Sign-up → first booking within 7 days | ≥ 40% |
| Booked → completed sessions | ≥ 70% |
| Sessions reported as a problem | < 3% |
| Members who both teach and learn within 30 days | ≥ 25% |
| Ledger invariant violations | 0 |
| p95 API latency (excluding Render cold start) | < 300 ms |
| Room connection success (both video tiles live) | ≥ 95% on common networks |

## 9. Release plan

| Version | Scope |
|---|---|
| **v1.0 (live)** | Everything marked Done above. Email verification and password reset were removed because Render's free tier blocks outbound SMTP. |
| **v1.1** | Admin screen for reports (FR21). Transactional email through an HTTPS API such as Brevo, bringing back password reset and booking alerts (FR22). Uptime ping to cut cold starts. |
| **v1.2** | Google sign-in (FR23), member reporting and blocking (FR24), calendar invites (FR25). |
| **Later** | Group sessions, Redis adapter for running more than one API instance, TURN relay by default. |

## 10. Risks and open questions

| Risk | Impact | Mitigation |
|---|---|---|
| Fake accounts farm the 2 signup credits | Inflated supply, credits moved to one account through fake sessions | Disposable domains blocked, auth rate limit. Next: Google sign-in or email verification over HTTPS (FR22, FR23), and admin review of unusual credit flows |
| Teacher and learner collude to confirm sessions that never happened | Credits created from nothing | They can only move existing credits (the bonus is the only source), so the total supply is bounded. The ledger makes patterns visible to admins |
| No password reset | Members who forget their password are locked out | Manual reset by the owner in Atlas (new bcrypt hash) until FR22 brings back reset by email |
| Learner disputes a session in bad faith | Teacher's credits frozen | Disputes open only after the start and before auto-release. An admin decides with the booking chat as context |
| Strict NAT or campus firewalls block peer-to-peer video | Room shows "Waiting" with no video | Optional TURN relay through `TURN_*`. Whiteboard and chat still work |
| Render free tier sleeps | First request takes 30 to 50 seconds, and a session can start late | Uptime ping on `/health` or a paid instance |
| Single API instance | Whiteboard state and sockets can't scale horizontally | Fine at current scale. Redis adapter and shared state later |
