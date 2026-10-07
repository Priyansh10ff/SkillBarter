# Skill Barter: Technical Reference

How the system is built: architecture, stack, folder structure, data model, the credit ledger and booking state machine, REST API, real-time events, the video room, security, configuration, testing and known limitations.

Related: [PRODUCT.md](./PRODUCT.md) (overview) · [PRD.md](./PRD.md) (requirements) · [DESIGN.md](./DESIGN.md) (interface) · [DEPLOYMENT.md](./DEPLOYMENT.md) (hosting)

---

## 1. Architecture

```
                         ┌──────────────────────────────┐
                         │      Browser (React SPA)     │
                         │  Vercel: static build + CDN  │
                         └──────┬─────────┬─────────┬───┘
               HTTPS /api/*     │         │ WSS     │ WebRTC media (peer to peer)
         (Bearer token)         │         │         │  ┌─────────────────────────┐
                                ▼         ▼         └─►│ Other participant's     │
                         ┌───────────────────────────┐ │ browser                 │
                         │  Node.js server (Render)  │ └─────────────────────────┘
                         │                           │
                         │  Express REST API  /api   │
                         │  Socket.IO     /socket.io │
                         │  PeerServer       /peerjs │  (WebRTC signalling only)
                         │  Auto-release cron job    │
                         └─────────────┬─────────────┘
                                       │ Mongoose (transactions)
                                       ▼
                             ┌──────────────────┐
                             │  MongoDB Atlas   │
                             │  (replica set)   │
                             └──────────────────┘
```

- **One Node process, one port.** It serves the REST API, Socket.IO and the PeerJS signalling server, and runs the auto-release job.
- **Media never touches the server.** Video, audio and screen share go directly between the two browsers over WebRTC. The server only helps them find each other.
- **A replica set is required.** Every credit movement is a multi-document transaction, which MongoDB only supports on replica sets. Atlas clusters, including the free M0, are replica sets. A standalone local `mongod` is not.
- **Layering on the server:** `routes → validate (zod) → controller → service → model`. Controllers stay thin. Business rules live in `services/`, and `creditService` is the only code allowed to change a balance.

## 2. Stack

### Client (`client/`)

| Concern | Library |
|---|---|
| UI | React 19 |
| Build / dev server | Vite 5 (dev proxy `/api` → `localhost:5000`) |
| Styling | Tailwind CSS 3 with CSS-variable design tokens (see [DESIGN.md](./DESIGN.md)) |
| Routing | React Router 7, every page lazy-loaded |
| HTTP | Axios, one instance with the token interceptor and 401 handling |
| Real-time | socket.io-client |
| Video | PeerJS (WebRTC) |
| Fonts | Instrument Sans and JetBrains Mono, self-hosted via `@fontsource` |
| Dialogs | Native `<dialog>` wrapped in `ui/Dialog`, plus a `useConfirm()` hook |
| Charts | Hand-written SVG (`wallet/BalanceChart`), no chart library |
| Dates | dayjs (relativeTime, advancedFormat), times shown in the viewer's timezone through `Intl` |
| Icons / toasts | lucide-react, react-hot-toast |
| Linting | ESLint 9 with react-hooks and react-refresh |

### Server (`server/`)

| Concern | Library |
|---|---|
| Runtime | Node.js 22+ (CommonJS) |
| HTTP | Express 5 (async errors reach the error handler automatically) |
| Database | MongoDB with Mongoose 9 |
| Real-time | Socket.IO 4 |
| WebRTC signalling | `peer` (ExpressPeerServer) |
| Auth | jsonwebtoken, bcryptjs |
| Validation | zod 4, for request bodies, queries and params, and for environment variables |
| Sign-up checks | disposable-email-domains |
| Security | helmet, cors, express-rate-limit |
| Performance / logs | compression, morgan |
| Scheduled job | node-cron |
| Tests | `node:test`, supertest, mongodb-memory-server (replica set), socket.io-client |
| Dev | nodemon |

## 3. Repository structure

```
SkillBarter/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── render.yaml                    Render blueprint for the API
├── docs/
│   ├── PRODUCT.md                 Why, who, how it works
│   ├── PRD.md                     Goals, user stories, requirements, roadmap, risks
│   ├── TECHNICAL.md               This file
│   ├── DESIGN.md                  Design system
│   ├── DEPLOYMENT.md              Atlas → Render → Vercel
│   └── screenshots/               README images
│
├── client/
│   ├── index.html
│   ├── vite.config.js             Dev proxy /api → :5000
│   ├── tailwind.config.js         Colours mapped to CSS variables
│   ├── vercel.json                SPA fallback, cache and security headers
│   ├── .env.development           VITE_SERVER_URL for local dev
│   ├── .env.example
│   ├── public/                    favicon.svg, robots.txt
│   └── src/
│       ├── main.jsx               Fonts, Toaster, ErrorBoundary
│       ├── App.jsx                Providers and routes
│       ├── index.css              Theme tokens, base styles, reduced motion
│       ├── api/client.js          Axios instance: base URL, Bearer token, 401 → auth:expired
│       ├── lib/
│       │   ├── config.js          API and socket URLs from VITE_SERVER_URL
│       │   ├── constants.js       Categories, durations, statuses
│       │   ├── date.js            dayjs with plugins
│       │   └── format.js          Hours, dates, API error helpers
│       ├── context/
│       │   ├── AuthContext.jsx    User, login, register, logout, profile updates
│       │   ├── SocketContext.jsx  One authenticated socket per session
│       │   ├── NotificationContext.jsx  Stored and live notifications
│       │   └── ConfirmContext.jsx useConfirm() on a native <dialog>
│       ├── hooks/                 useBookListing, useDebounced, useDismiss, useElementWidth, useHeldCredits
│       ├── components/
│       │   ├── ui/                Button, Field/Input/Select/Textarea, Panel, Dialog, Hours, StatusTag,
│       │   │                      Stamp, Avatar, Segmented, SkillInput, TimezoneSelect, Skeleton, …
│       │   ├── layout/            AppShell, Navbar, UserMenu, NotificationBell, Footer,
│       │   │                      ProtectedRoute, PageLoader, ErrorBoundary
│       │   ├── landing/           ExchangeBoard, CommunityStats, HowItWorks
│       │   ├── listings/          ListingRow, ListingForm, BookingSummary, BarterMatches
│       │   ├── bookings/          BookingTrack, BookingChat, ReviewDialog
│       │   ├── room/              VideoTile, Whiteboard, SessionTimer, useLocalMedia, usePeerCall
│       │   ├── profile/           ProfileParts, ReviewList
│       │   ├── wallet/            BalanceChart
│       │   └── auth/              AuthLayout, FormError
│       └── pages/                 Home, Login, Register, Welcome, Settings, Profile, PublicProfile,
│                                  CreateListing, EditListing, ListingDetail, Bookings, Room, Wallet,
│                                  Leaderboard, NotFound, StyleGuide (dev only)
│
└── server/
    ├── server.js                  HTTP server, sockets, PeerServer, cron, graceful shutdown
    ├── app.js                     Express app (middleware + routes), exported for tests
    ├── config/
    │   ├── env.js                 Environment validated with zod; exits on bad config
    │   ├── db.js                  Mongoose connection, optional DNS_SERVERS
    │   ├── corsOrigins.js         Allowed origins for HTTP and sockets
    │   ├── peerServer.js          PeerServer on a private http.Server, /peerjs upgrades forwarded
    │   └── constants.js           Signup bonus, windows, categories, durations, statuses, ledger types
    ├── models/                    User, Listing, Booking, CreditEntry, Review, Message, Notification
    ├── middleware/                auth (protect, requireAdmin), validate, rateLimit, errorHandler
    ├── validators/                zod schemas per resource
    ├── routes/ + controllers/     auth, users, listings, bookings, reviews, wallet, notifications, admin, stats
    ├── services/
    │   ├── creditService.js       The only code that changes balances; writes the ledger
    │   ├── bookingService.js      Booking state machine, transactions, auto-release
    │   ├── bookingEvents.js       Who is notified about each booking change, and what they're told
    │   ├── roomService.js         Room access window, signed peer IDs, ICE servers
    │   ├── reviewService.js       Reviews and running rating averages
    │   ├── badgeService.js        Milestone badges (idempotent)
    │   ├── matchService.js        Suggested listings and two-way barter matches
    │   ├── notificationService.js Store + push notifications
    │   └── realtime.js            Holds the Socket.IO instance; emitToUser()
    ├── sockets/
    │   ├── index.js               JWT handshake auth, user:<id> rooms
    │   └── roomHandlers.js        Session room presence and whiteboard relay
    ├── jobs/autoRelease.js        Runs on boot and every 10 minutes
    ├── utils/                     AppError, tokens (JWT), escapeRegex, format
    ├── scripts/                   seed, makeAdmin, resetDb
    └── tests/                     helpers + auth, users, listings, bookings, notifications,
                                   room, reviews, seed
```

### Client routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing: hero, live sessions board, community numbers, search, suggestions | Public |
| `/login`, `/register` | Auth | Public |
| `/listings/:id` | Listing detail and booking | Public (booking needs login) |
| `/u/:id` | Public profile | Public |
| `/leaderboard` | Top teachers | Public |
| `/welcome` | 3-step onboarding | Logged in |
| `/create-listing`, `/listings/:id/edit` | Listing form | Logged in (owner for edit) |
| `/bookings` | All bookings with timeline, scheduling, chat, reviews | Logged in |
| `/room/:id` | Session room (full screen, outside the app shell) | Participants, inside the window |
| `/wallet` | Balance, held credits, chart, ledger | Logged in |
| `/profile`, `/settings` | Own profile; profile fields and password | Logged in |
| `/dev/ui` | Component style guide | Development builds only |

## 4. Data model

All documents have `createdAt` / `updatedAt`.

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercased |
| password | String | bcrypt hash, `select: false` |
| bio | String | max 500 |
| skillsOffered | [String] | normalised lowercase tags |
| skillsRequested | [String] | skills the user wants to learn |
| preferredHours | String | e.g. "Weekdays 6pm–9pm" |
| timezone | String | IANA name, e.g. `Asia/Kolkata` |
| timeCredits | Number | available balance. Starts at 0 and the signup bonus adds 2 through the ledger. Never below 0 |
| stats.classesTaught / classesAttended | Number | incremented on completion |
| rating / ratingCount | Number | running average of received reviews |
| badges | [{ code, name, dateEarned }] | awarded by `badgeService`: First lesson, Taught ×5/×10/×25, Learned ×5/×10, Both sides, Well rated (4.5+ from 5+ reviews) |
| role | `user` \| `admin` | |
| onboardedAt | Date | set when onboarding is finished |
| passwordChangedAt | Date | `select: false`. Tokens issued before it are rejected |

### Listing
| Field | Type | Notes |
|---|---|---|
| teacher | ObjectId → User | |
| title | String | 3–100 chars |
| description | String | 10–2000 chars |
| category | String | `Coding`, `Design`, `Music`, `Language`, `Academics`, `Career`, `Lifestyle`, `Other` |
| tags | [String] | max 8 |
| duration | Number | 30, 60, 90 or 120 minutes |
| creditCost | virtual | `duration / 60` |
| isActive | Boolean | soft delete; inactive listings cannot be booked |

Indexes: text index on `title`, `description`, `tags`; `{ category, isActive, createdAt }`.

### Booking
| Field | Type | Notes |
|---|---|---|
| learner | ObjectId → User | pays credits |
| teacher | ObjectId → User | earns credits |
| listing | ObjectId → Listing | |
| listingSnapshot | { title, duration, category } | preserved if listing is edited later |
| creditCost | Number | fixed at booking time |
| status | enum | see state machine below |
| proposal | { date, by } | current open time proposal |
| scheduledAt | Date | agreed start time |
| endsAt | Date | `scheduledAt + duration` |
| autoReleaseAt | Date | `endsAt + 48h` |
| completedAt | Date | |
| cancelledBy / cancelReason | ObjectId / String | |
| dispute | { reason, openedAt, resolvedAt, outcome } | |
| reviewedByLearner / reviewedByTeacher | Boolean | |

Indexes: `{ learner, status }`, `{ teacher, status }`, `{ status, autoReleaseAt }`.

### CreditEntry (ledger)
| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | |
| amount | Number | positive or negative |
| type | enum | `SIGNUP_BONUS`, `BOOKING_HOLD`, `REFUND`, `SESSION_EARNING`, `ADMIN_ADJUSTMENT` |
| booking | ObjectId → Booking | when related |
| balanceAfter | Number | user's `timeCredits` after this entry |

Append-only. For every user, `sum(amount) === timeCredits` must always hold.

### Review
`booking`, `author`, `subject`, `role` (the author's role), `rating` (1–5), `comment` (max 500). Unique index on `{ booking, author }`. Posting one flips `reviewedByLearner` / `reviewedByTeacher` on the booking in the same transaction (that flag is the lock against double reviews) and updates the subject's running average in the database.

### Message
`booking`, `sender`, `body` (max 1000). Used for both booking chat and in-room chat.

### Notification
`user`, `type`, `message`, `link`, `read`. TTL index removes entries after 90 days.

## 5. Credits and booking lifecycle

### State machine

```
             book (hold credits)
   ────────────────────────────────►  PENDING
                                        │   propose / counter
                                        │◄──────────────┐
                                        │───────────────┘
                     accept proposal    │
                                        ▼
                                    SCHEDULED
                ┌───────────────────────┼─────────────────────────┐
  learner marks │      48h after endsAt │ (no dispute)             │ learner reports
  complete      ▼                       ▼                          ▼ a problem
            COMPLETED ◄──────────── COMPLETED                  DISPUTED
         (release to teacher)    (auto-release job)               │ admin resolves
                                                                  ├─► COMPLETED (release)
                                                                  └─► CANCELLED (refund)

  From PENDING or SCHEDULED (before scheduledAt):
     teacher declines / either side cancels ─────────────────► CANCELLED (refund)
```

### Rules
- **Book**: learner cannot book their own listing, listing must be active, balance must cover `creditCost`. Credits move from learner's balance into the booking (`BOOKING_HOLD`).
- **Propose / accept**: either participant can propose a future time. Only the *other* participant can accept it. Accepting sets `scheduledAt`, `endsAt`, `autoReleaseAt` and moves to `SCHEDULED`.
- **Complete**: only the learner, only from `SCHEDULED`, only after `scheduledAt`. Teacher receives `creditCost` (`SESSION_EARNING`), both stats increment, badges are checked.
- **Cancel / decline**: from `PENDING`, or from `SCHEDULED` before `scheduledAt`. Learner gets `creditCost` back (`REFUND`).
- **Dispute**: learner only, from `SCHEDULED` after `scheduledAt` and before `autoReleaseAt`. Credits stay held until an admin resolves it.
- **Auto-release**: `node-cron` runs every 10 minutes and completes every `SCHEDULED` booking whose `autoReleaseAt` has passed. The same check also runs when a user loads their bookings, so a sleeping server catches up on wake.

### Guarantees
- Every transition is one MongoDB transaction: booking status update + user balance update + ledger entry commit together or not at all.
- Status transitions use conditional updates (`findOneAndUpdate({ _id, status: <expected> })`), so double clicks and concurrent requests cannot complete or refund twice.
- Balance updates use `$inc` with a `timeCredits: { $gte: cost }` guard, so a balance can never go negative.
- `creditService` is the only code allowed to change `timeCredits`.

## 6. REST API

Base path `/api`. JSON in and out. Authenticated routes need `Authorization: Bearer <token>`. Errors return `{ message, code?, details? }` with a proper status code (see [section 9](#errors-and-operations)).

### Auth — `/api/auth`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | – | Create account with 2 credits, returns `{ token, user }` |
| POST | `/login` | – | Returns `{ token, user }` |

### Users — `/api/users`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | ✓ | Current user |
| PUT | `/me` | ✓ | Update name, bio, skills, preferred hours, timezone |
| PUT | `/me/password` | ✓ | Change password |
| GET | `/:id` | – | Public profile (no email) with listings and reviews |
| GET | `/leaderboard` | – | `?sort=taught` (sessions taught) or `?sort=rated` (average rating, 3+ reviews); top 20 |
| GET | `/matches` | ✓ | Users who teach what you want and want what you teach |

### Listings — `/api/listings`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | – | `?q=&category=&page=&limit=` active listings → `{ items, total, page, totalPages }` |
| GET | `/suggested` | ✓ | Listings whose tags or title match your `skillsRequested` |
| GET | `/my` | ✓ | Your listings |
| GET | `/:id` | – | `{ listing, more }`: the listing, its teacher, and up to 3 more by them |
| POST | `/` | ✓ | Create |
| PUT | `/:id` | ✓ owner | Update. Existing bookings keep their snapshot |
| DELETE | `/:id` | ✓ owner | Deactivate |

### Bookings — `/api/bookings`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/` | ✓ | Book a listing `{ listingId, proposedDate? }` |
| GET | `/` | ✓ | Your bookings `?role=learner\|teacher&status=` |
| GET | `/:id` | ✓ participant | Single booking |
| POST | `/:id/propose` | ✓ participant | `{ date }` |
| POST | `/:id/accept` | ✓ other participant | Accept current proposal |
| POST | `/:id/cancel` | ✓ participant | `{ reason? }` (teacher cancel on PENDING = decline) |
| POST | `/:id/complete` | ✓ learner | Release credits |
| POST | `/:id/dispute` | ✓ learner | `{ reason }` |
| GET | `/:id/messages` | ✓ participant | Chat history |
| POST | `/:id/messages` | ✓ participant | `{ body }` |
| GET | `/:id/room` | ✓ participant | Room access check: returns your role and the peer IDs |

### Reviews — `/api/reviews`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/` | ✓ participant | `{ bookingId, rating, comment }`, booking must be COMPLETED |
| GET | `/user/:id` | – | Reviews received by a user, newest first |

### Stats — `/api/stats`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/stats` | – | Landing-page numbers: members, sessions completed, hours exchanged, open listings (cached 60 s) |

### Wallet — `/api/wallet`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | ✓ | Balance, credits held in open bookings, ledger entries (paginated) and `history`: the last 100 movements for the balance chart |

### Notifications — `/api/notifications`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | ✓ | Latest notifications + unread count |
| PUT | `/:id/read` | ✓ | Mark one read |
| PUT | `/read-all` | ✓ | Mark all read |

### Admin — `/api/admin`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/disputes` | admin | Open disputes |
| POST | `/disputes/:bookingId/resolve` | admin | `{ outcome: "release" \| "refund" }` |

### Health
`GET /health` returns `{ status: "ok", db: "connected" }`. Used by Render and uptime monitoring.

## 7. Real-time (Socket.IO)

The client connects with `io(SOCKET_URL, { auth: { token } })`. The server verifies the JWT in the handshake, rejects invalid tokens and joins each socket to a private room `user:<userId>`. User IDs are never taken from the query string.

### Server → client
| Event | Payload | When |
|---|---|---|
| `notification` | Notification document | Any new notification |
| `credits:update` | `{ timeCredits }` | Balance changed |
| `booking:update` | `{ bookingId, status }` | Status, proposal or schedule changed. The client refetches |
| `message:new` | Message document | New booking or room chat message |

### Session room
| Direction | Event | Payload | Notes |
|---|---|---|---|
| C → S | `room:join` | `{ bookingId }`, ack `{ ok, others, strokes }` | Same rules as `GET /api/bookings/:id/room`: participant, `SCHEDULED`, inside the room window. `others` = users already in the room, `strokes` = current whiteboard |
| S → C | `room:peer-joined` / `room:peer-left` | `{ userId }` | Presence; `peer-left` also fires on disconnect |
| C → S → C | `wb:stroke` | `{ bookingId, stroke: { points: [[x, y]], color, width } }` | Points are 0–1 on a 4:3 board, width in 1000-px units. Validated (palette colours only, ≤ 500 points) and kept in memory for late joiners |
| C → S → C | `wb:clear` | `{ bookingId }` | Clears the board for both |
| C → S | `room:leave` | `{ bookingId }` | |

Whiteboard events from a socket that hasn't joined that room are ignored. In-room chat uses the booking messages API, so it's the same thread as the Bookings page.

## 8. Video room (WebRTC)

- **Access**: `GET /api/bookings/:id/room` returns the caller's role, both names, both peer IDs, the schedule and ICE servers. The room opens 15 minutes before `scheduledAt` and closes 3 hours after `endsAt`; outside that, or if the booking isn't `SCHEDULED`, it answers 400 with `code` `ROOM_NOT_OPEN` (plus `opensAt`), `ROOM_CLOSED` or `ROOM_NOT_SCHEDULED`.
- **Peer IDs** are `<bookingId>-<role>-<HMAC>`, signed with `JWT_SECRET`, so they're stable for both sides but can't be guessed, squatted or called by anyone else.
- **PeerServer** (`peer` package) is mounted at `/peerjs` on the API server (`config/peerServer.js`). Its WebSocket server rejects every upgrade outside its own path, which would kill Socket.IO on the same port, so it runs on a private `http.Server` and only `/peerjs` upgrades are forwarded to it.
- **Who calls**: only the learner places the call (when the teacher is already present, or when they arrive); the teacher answers. This avoids both sides calling at once. If the other peer isn't registered yet, the learner retries once after 2 s.
- **ICE**: Google public STUN by default; set `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` to add a TURN relay for users behind strict NATs.
- **Screen share** swaps the outgoing video track with `RTCRtpSender.replaceTrack` and restores the camera when sharing stops (including the browser's own "Stop sharing" button).
- **No camera or mic**: the room still works receive-only, with whiteboard and chat.
- **Leaving** stops every media track (the camera light goes off), destroys the peer and leaves the socket room.

## 9. Auth and security

### Authentication
- Passwords are hashed with bcrypt (cost 10). The field is `select: false`, so it is never loaded unless a query asks for it and never serialised.
- Sign-up and login return a JWT (`{ id }`, signed with `JWT_SECRET`, 7-day expiry by default). The client keeps it in `localStorage` and sends `Authorization: Bearer <token>`.
- Every authenticated request reloads the user. A token for a deleted user, or one issued before `passwordChangedAt`, gets `401`. Changing the password therefore signs out every other session, and the current one receives a fresh token.
- On any `401` for a request that carried a token, the Axios instance fires `auth:expired` and `AuthContext` logs out with a toast.
- Socket.IO connections send the same token in the handshake (`auth: { token }`) and are refused without a valid one.

### Authorisation
- Bookings, booking chat, rooms and reviews are only available to the booking's learner and teacher. To anyone else they look missing (`404`).
- Listing edits and removal are owner only (`403`). Admin routes need `role: "admin"`, granted with `npm run make-admin`.
- Public profiles, leaderboards and matches select explicit public fields, never email or balance.

### Input and transport
- Every body, query and params object is validated with zod (`middleware/validate.js`). Unknown fields are stripped, so a client can't set `timeCredits`, `role` or `rating`.
- Search input is regex-escaped before it reaches MongoDB.
- `helmet` security headers, `compression`, `express.json({ limit: "100kb" })`.
- CORS and Socket.IO accept only `CLIENT_URL` in production, and also `localhost:5173` and `:3000` in development.
- `trust proxy` is set to 1 so rate limits see the real client IP behind Render.
- Rate limits per IP: **20 requests / 15 min** on `/api/auth/*` and password change, **300 / 15 min** on the rest of `/api`.
- Disposable email domains are rejected at sign-up.

### Errors and operations
- Errors are returned as `{ message, code?, details? }` with the right status. `details` lists field errors for forms. `code` is a machine-readable string such as `ROOM_NOT_OPEN`.
- Mongoose cast, duplicate-key and validation errors map to `400` or `409`. Stack traces and 5xx messages are hidden in production.
- `/health` returns `200 { status: "ok", db: "connected" }` or `503` when the database is down.
- On `SIGTERM` (Render deploys) the server stops the cron job, closes sockets and the HTTP server, and disconnects Mongo.
- No secrets are in the repo. `.env` files are git-ignored, and each app has a `.env.example`.

### Client
- WCAG AA contrast on every surface, checked with axe-core. Visible focus, labelled fields, `role="alert"` on form errors, and reduced motion respected.
- An error boundary replaces a crashed page with a reload screen.
- `vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and a `Permissions-Policy` that allows camera, microphone and screen capture only on the app's own origin.

## 10. Configuration

### `server/.env`

| Key | Required | Default | Purpose |
|---|---|---|---|
| `MONGO_URI` | ✓ | | MongoDB replica-set connection string. Put the database name before `?`, e.g. `/skillbarter?…` |
| `JWT_SECRET` | ✓ | | At least 16 characters (use 64+ random hex). Signs tokens and room peer IDs. Changing it logs everyone out |
| `NODE_ENV` | | `development` | `production` on Render. Controls CORS, logging and error detail |
| `PORT` | | `5000` | Render sets it |
| `CLIENT_URL` | prod | `http://localhost:5173` | Exact client origin, `https://…` with no trailing slash |
| `JWT_EXPIRES_IN` | | `7d` | Session length |
| `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | | | Optional TURN relay added to the ICE servers |
| `DNS_SERVERS` | | | e.g. `1.1.1.1,8.8.8.8`. Fixes `querySrv ECONNREFUSED` on networks whose DNS can't resolve `mongodb+srv` records. Local use only |

`config/env.js` validates all of this at startup and exits with one line per problem.

### `client/.env*`

| Key | Purpose |
|---|---|
| `VITE_SERVER_URL` | The API origin for REST, Socket.IO and PeerJS. In development REST goes through the Vite proxy and sockets use this URL. In production everything uses it. It's baked in at build time, so it's set in the Vercel dashboard and needs a redeploy after a change |

## 11. Local development

```bash
# 1. API
cd server
cp .env.example .env        # MONGO_URI, JWT_SECRET
npm install
npm run seed                # optional demo data (6 members, password "password123")
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

To test a session room, log in as the learner and the teacher in two browsers (or one normal and one private window). The seed creates scheduled sessions you can open.

| Location | Script | Does |
|---|---|---|
| server | `npm run dev` | nodemon |
| server | `npm start` | Production start |
| server | `npm test` | All API tests |
| server | `npm run seed` | Demo data through the real services (`-- --reset` empties first). Refuses in production |
| server | `npm run make-admin -- <email>` | Grants the admin role |
| server | `npm run reset` | Empties every collection (keeps indexes). Refuses in production |
| client | `npm run dev` / `build` / `preview` | Vite |
| client | `npm run lint` | ESLint |

## 12. Testing

- **Runner:** `node --test` with supertest against the real Express app and Socket.IO server.
- **Database:** `mongodb-memory-server` in replica-set mode, so transactions behave as on Atlas. The first run downloads a MongoDB binary (~100 MB). Tests never touch a real database.
- **Suites:** `auth`, `users`, `listings` (search, paging, suggestions, matches), `bookings` (state machine, refunds, disputes, auto-release, concurrency), `notifications` (notifications, chat, socket auth), `room` (access window, peer IDs, presence, whiteboard relay), `reviews` (ratings, badges, leaderboard, stats), `seed` (the demo data keeps the ledger consistent).
- **Ledger invariants** are checked after every booking test (`helpers.assertLedgerConsistent`):
  1. For each user, the sum of their `CreditEntry` amounts equals `timeCredits`.
  2. Total balances plus total held in open bookings equals the total ever granted.
  3. No balance is below 0.
- **Concurrency:** parallel book, complete and cancel requests must move credits exactly once.
- **Client:** `npm run lint` and `npm run build` must pass. Pages were audited with axe-core.

## 13. Known limitations

| Limitation | Effect | Planned fix |
|---|---|---|
| No email | No verification, password reset or email alerts. Render's free tier blocks outbound SMTP (ports 25, 465, 587) | Transactional email over an HTTPS API (PRD FR22) |
| Signup credits can be farmed | Many accounts × 2 credits | Google sign-in or verified email, plus admin review of credit flows (FR22, FR23) |
| No admin screen for disputes | Admins resolve with `GET /api/admin/disputes` and `POST /api/admin/disputes/:id/resolve` | Admin page (FR21) |
| JWT in `localStorage` | An XSS bug could read the token. No server-side revocation except a password change | HTTP-only cookie on a shared custom domain |
| Single instance | Whiteboard strokes live in memory and are lost on restart. Sockets can't span instances | Socket.IO Redis adapter, strokes in Redis |
| Free-tier cold start | First request after ~15 idle minutes takes 30 to 50 s | Uptime ping on `/health` or a paid instance |
| STUN only by default | Peers behind symmetric NAT can't connect video | Configure `TURN_*` |
| No member reporting or blocking | Abuse handled manually | FR24 |

## 14. Deployment

| Piece | Platform | Settings |
|---|---|---|
| Client | Vercel | Root `client`, Vite preset, output `dist`. `VITE_SERVER_URL` in the dashboard. `vercel.json` sends every route to `index.html` and adds headers |
| API | Render web service | Blueprint `render.yaml`: root `server`, build `npm ci --omit=dev`, start `npm start`, health check `/health`, Node 22 |
| Database | MongoDB Atlas | Any replica set (free M0 works). Network access `0.0.0.0/0` for Render's free tier |

The step-by-step guide is in [DEPLOYMENT.md](./DEPLOYMENT.md).
