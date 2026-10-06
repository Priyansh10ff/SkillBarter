# Skill Barter: Technical Reference

How the system is built: architecture, stack, folder structure, data model, credit logic, API, real-time events, security, configuration and deployment. For the product side (why, for whom, what it does) see [PRODUCT.md](./PRODUCT.md).

---

## 1. Architecture

```
                         ┌──────────────────────────────┐
                         │      Browser (React SPA)     │
                         │  Vercel: static build + CDN  │
                         └──────┬─────────┬─────────┬───┘
                 HTTPS /api/*   │         │ WSS     │ WebRTC media (peer to peer)
        (Vercel rewrite → API)  │         │         │  ┌─────────────────────────┐
                                ▼         ▼         └─►│  Other participant's     │
                         ┌──────────────────────────┐  │  browser                 │
                         │  Node.js server (Render)  │  └─────────────────────────┘
                         │                           │
                         │  Express REST API  /api   │
                         │  Socket.IO         /socket.io
                         │  PeerServer        /peerjs│  (WebRTC signalling only)
                         │  Auto-release job         │
                         └──────┬─────────────┬──────┘
                                │             │ SMTP
                                ▼             ▼
                      ┌────────────────┐  ┌──────────┐
                      │ MongoDB Atlas  │  │  Gmail   │
                      │ (replica set)  │  │ (email)  │
                      └────────────────┘  └──────────┘
```

- One Node process serves the REST API, Socket.IO and the PeerJS signalling server on the same HTTP server and port.
- Video and audio go directly between the two browsers over WebRTC. The server only brokers the connection.
- MongoDB Atlas runs as a replica set, which allows multi-document transactions. Every credit movement uses one. A plain standalone local `mongod` will not work; use Atlas (free M0 is fine) or a local single-node replica set.

## 2. Stack

### Client (`client/`)

| Concern | Library |
|---|---|
| UI | React 19 |
| Build / dev server | Vite |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer |
| Routing | React Router 7 |
| HTTP | Axios (single configured instance) |
| Real-time | socket.io-client |
| Video | PeerJS (WebRTC) |
| Fonts | Instrument Sans + JetBrains Mono, self-hosted via @fontsource |
| Dialogs | Native `<dialog>` wrapped in `ui/Dialog` and `useConfirm()` |
| Charts | Recharts (wallet history) |
| Dates | dayjs |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| Linting | ESLint 9 with react-hooks and react-refresh plugins |

### Server (`server/`)

| Concern | Library |
|---|---|
| Runtime | Node.js 22+ (CommonJS) |
| HTTP framework | Express 5 |
| Database | MongoDB with Mongoose 9 |
| Real-time | Socket.IO 4 |
| WebRTC signalling | `peer` (ExpressPeerServer) |
| Auth | jsonwebtoken, bcryptjs |
| Validation | zod |
| Email | Nodemailer (Gmail SMTP with app password) |
| Email checks | disposable-email-domains |
| Security | helmet, cors, express-rate-limit |
| Performance / logs | compression, morgan |
| Scheduled job | node-cron |
| Tests | node:test (built in), supertest, mongodb-memory-server (replica set mode) |
| Dev | nodemon |

Not used: Stripe (the product has no payments), the `crypto` npm package (Node's built-in `crypto` is used), moment (replaced by dayjs).

## 3. Repository structure

```
SkillBarter/
├── README.md                     Short intro + quick start
├── render.yaml                   Render blueprint for the server
├── .gitignore
├── docs/
│   ├── PRODUCT.md                Product overview: why, who, features
│   ├── TECHNICAL.md              This file
│   └── DEPLOYMENT.md             Step-by-step deploy guide
│
├── client/
│   ├── index.html
│   ├── vite.config.js            Dev proxy /api → localhost:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── vercel.json               SPA fallback + /api rewrite to Render
│   ├── .env.development          Local URLs (no secrets)
│   ├── .env.production           Production URLs (no secrets)
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── main.jsx              Providers + Toaster
│       ├── App.jsx               Routes, protected route wrapper
│       ├── index.css
│       ├── api/
│       │   └── client.js         Axios instance: base URL, auth header, 401 handling
│       ├── context/
│       │   ├── AuthContext.jsx   User, token, login/register/logout/refresh
│       │   ├── SocketContext.jsx Authenticated socket connection
│       │   └── NotificationContext.jsx  Persisted + live notifications
│       ├── hooks/
│       │   ├── useBookings.js
│       │   ├── useListings.js
│       │   └── usePeerCall.js    WebRTC call lifecycle for the room
│       ├── lib/
│       │   ├── config.js         API and socket URLs from env
│       │   ├── date.js           dayjs with plugins
│       │   ├── constants.js      Categories, durations, booking statuses
│       │   └── format.js         Credits, dates, durations
│       ├── components/
│       │   ├── layout/           AppShell, Navbar, UserMenu, NotificationBell, ProtectedRoute
│       │   ├── ui/               Button, Field/Input/Select/Textarea, Panel, Dialog, Hours, StatusTag, Stamp, Avatar, Segmented, EmptyState, Skeleton
│       │   ├── listings/         ListingCard, ListingForm, ListingFilters
│       │   ├── bookings/         BookingCard, ScheduleControls, BookingChat, ReviewForm
│       │   ├── room/             VideoTile, CallControls, Whiteboard, RoomChat
│       │   └── auth/             AuthLayout, FormError
│       └── pages/
│           ├── Home.jsx          Hero, search, listing grid, suggestions
│           ├── ListingDetail.jsx
│           ├── CreateListing.jsx (also used for edit)
│           ├── Bookings.jsx      All bookings grouped by status
│           ├── Room.jsx          Session room
│           ├── Profile.jsx       Own profile editing
│           ├── PublicProfile.jsx /u/:id
│           ├── Wallet.jsx        Balance, chart, ledger history
│           ├── Leaderboard.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── VerifyEmail.jsx
│           ├── ForgotPassword.jsx
│           ├── ResetPassword.jsx
│           ├── NotFound.jsx
│           └── StyleGuide.jsx    /dev/ui, development builds only
│
└── server/
    ├── server.js                 Bootstraps HTTP server, Express, Socket.IO, PeerServer, job
    ├── app.js                    Express app (middleware + routes), exported for tests
    ├── package.json
    ├── .env.example
    ├── config/
    │   ├── db.js                 Mongoose connection
    │   ├── corsOrigins.js        Allowed origins for API and sockets
    │   └── env.js                Validated environment variables (zod)
    ├── models/
    │   ├── User.js
    │   ├── Listing.js
    │   ├── Booking.js
    │   ├── CreditEntry.js
    │   ├── Review.js
    │   ├── Message.js
    │   └── Notification.js       TTL index: removed after 90 days
    ├── middleware/
    │   ├── auth.js               protect, requireAdmin
    │   ├── validate.js           zod request validation
    │   ├── rateLimit.js
    │   └── errorHandler.js       notFound + central error handler
    ├── validators/               zod schemas per resource
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── listingRoutes.js
    │   ├── bookingRoutes.js
    │   ├── reviewRoutes.js
    │   ├── walletRoutes.js
    │   ├── notificationRoutes.js
    │   └── adminRoutes.js
    ├── controllers/              One per route file, thin: validate → call service → respond
    ├── services/
    │   ├── creditService.js      All credit movements (hold, release, refund, bonus)
    │   ├── bookingService.js     Booking state machine
    │   ├── badgeService.js       Milestone badge awards
    │   ├── matchService.js       Suggested listings and barter matches
    │   ├── notificationService.js Persist + emit + email
    │   └── emailService.js       Nodemailer templates
    ├── sockets/
    │   ├── index.js              JWT handshake auth, personal rooms
    │   └── roomHandlers.js       Session room: join, presence, whiteboard
    ├── jobs/
    │   └── autoRelease.js        Releases credits 48h after scheduled end
    ├── utils/
    │   ├── AppError.js
    │   ├── asyncHandler.js
    │   └── tokens.js             JWT + hashed one-time tokens
    ├── scripts/
    │   ├── seed.js               Demo users, listings, bookings
    │   └── resetDb.js            Refuses to run when NODE_ENV=production
    └── tests/
        ├── helpers.js            In-memory replica set, fixtures, ledger invariant checks
        ├── auth.test.js
        ├── users.test.js         Profile, password change, public profiles
        ├── listings.test.js      Search, paging, edits, suggestions, barter matches
        ├── bookings.test.js      Booking flow, credits, disputes, concurrency
        ├── notifications.test.js Notifications, booking chat, socket auth
        └── room.test.js          Room access window, peer IDs, presence, whiteboard relay
```

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
| timeCredits | Number | available balance, default 2, never below 0 |
| stats.classesTaught / classesAttended | Number | incremented on completion |
| rating / ratingCount | Number | running average of received reviews |
| badges | [{ name, icon, dateEarned }] | |
| role | `user` \| `admin` | |
| isVerified | Boolean | |
| verificationToken / verificationExpires | String / Date | SHA-256 hash of emailed token, 24h |
| resetToken / resetExpires | String / Date | SHA-256 hash, 1h |

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
`booking`, `author`, `subject`, `rating` (1–5), `comment` (max 500). Unique index on `{ booking, author }`.

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
- **Book**: learner must be verified, cannot book their own listing, listing must be active, balance must cover `creditCost`. Credits move from learner's balance into the booking (`BOOKING_HOLD`).
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

Base path `/api`. JSON in and out. Authenticated routes need `Authorization: Bearer <token>`. Errors return `{ message, details? }` with a proper status code.

### Auth — `/api/auth`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | – | Create account, send verification email |
| POST | `/login` | – | Returns `{ token, user }` |
| GET | `/verify-email/:token` | – | Verify email, returns `{ token, user }` |
| POST | `/resend-verification` | – | Resend verification email |
| POST | `/forgot-password` | – | Send reset email (same response whether or not the email exists) |
| POST | `/reset-password/:token` | – | Set new password |

### Users — `/api/users`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | ✓ | Current user |
| PUT | `/me` | ✓ | Update name, bio, skills, preferred hours, timezone |
| PUT | `/me/password` | ✓ | Change password |
| GET | `/:id` | – | Public profile (no email) with listings and reviews |
| GET | `/leaderboard` | – | Top 10 by classes taught, then rating |
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
| GET | `/user/:id` | – | Reviews received by a user |

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
| `booking:update` | Booking document | Status, proposal or schedule changed |
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

- Passwords hashed with bcrypt (cost 10). Password field excluded from queries by default.
- JWT signed with `JWT_SECRET`, 7-day expiry, sent as a Bearer token. Stored in `localStorage` on the client. The Axios instance logs the user out on any 401.
- Login is blocked until the email is verified. Verification and reset tokens are random 32-byte values, stored only as SHA-256 hashes, with expiry.
- Disposable email domains are rejected at registration.
- Every protected resource checks ownership or participation on the server, never only in the UI.
- Input validated with zod on every write endpoint; unknown fields are stripped.
- `helmet` for security headers, `cors` restricted to `CLIENT_URL`, `express.json({ limit: "100kb" })`.
- Rate limits: auth routes 10 requests per 15 minutes per IP; all other API routes 300 per 15 minutes.
- Central error handler: no stack traces in production responses.
- No secrets in the repo. `.env` files are git-ignored and `.env.example` files list every key.

## 10. Environment variables

### `server/.env`
| Key | Example | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | |
| `PORT` | `5000` | |
| `MONGO_URI` | `mongodb+srv://...` | Atlas connection string |
| `JWT_SECRET` | long random string | |
| `JWT_EXPIRES_IN` | `7d` | Optional |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin and links in emails |
| `EMAIL_USER` | `you@gmail.com` | Gmail sender. Optional outside production: without it, emails (including verification links) are printed to the server console |
| `EMAIL_PASS` | 16-char app password | |
| `TURN_URL` / `TURN_USERNAME` / `TURN_CREDENTIAL` | optional | TURN relay for WebRTC (e.g. Metered, Twilio, coturn) |

### `client/.env`
| Key | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | empty in dev, `/api` via Vercel rewrite in prod | Axios base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` / `https://<render-app>.onrender.com` | Socket.IO and PeerServer host |

## 11. Local development

```bash
# 1. Server
cd server
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, EMAIL_*
npm install
npm run seed                # optional demo data
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install                 # .env.development is already set up
npm run dev                 # http://localhost:5173, /api proxied to :5000
```

To test a session room locally, log in as the learner and the teacher in two different browsers (or one normal and one private window).

### Scripts

| Location | Script | Does |
|---|---|---|
| server | `npm run dev` | nodemon |
| server | `npm start` | production start |
| server | `npm test` | node:test + supertest against an in-memory replica set |
| server | `npm run seed` | Demo data |
| server | `npm run reset` | Wipe database (blocked in production) |
| client | `npm run dev` | Vite dev server |
| client | `npm run build` | Production build to `dist/` |
| client | `npm run lint` | ESLint |
| client | `npm run preview` | Serve the build locally |

## 12. Testing

- Server tests run against `mongodb-memory-server` in replica set mode, so transactions behave as in Atlas. Tests never touch a real database. The first run downloads a MongoDB binary (~100 MB) into the npm cache.
- Coverage focus: the booking state machine and the credit ledger.
- Invariants checked after every booking test:
  - for each user, the sum of their ledger entries equals `timeCredits`
  - total credits in balances + total held in open bookings = total ever granted
  - no balance below 0
- Concurrency tests fire parallel book / complete / cancel requests and assert credits move exactly once.
- Client: `npm run lint` and `npm run build` must pass.

## 13. Deployment

| Piece | Platform | Settings |
|---|---|---|
| Client | Vercel | Root `client`, framework Vite, build `npm run build`, output `dist`. `vercel.json` rewrites `/api/*` to the Render server and everything else to `index.html`. |
| Server | Render (web service) | Root `server`, build `npm install`, start `npm start`, health check `/health`. Env vars from section 10. `render.yaml` describes the service. |
| Database | MongoDB Atlas | Replica set cluster (any tier, including free M0), database `skillbarter`, network access for Render. |
| Email | Gmail SMTP | Account with 2FA and an app password. |

Notes:
- REST calls go through the Vercel rewrite (same origin). Socket.IO and PeerJS connect straight to the Render URL from `VITE_SOCKET_URL`, which must be in the server's CORS allow-list via `CLIENT_URL`.
- Render's free tier sleeps after inactivity. The first request after sleep takes ~30–50 seconds; the auto-release job catches up on wake.
- Step-by-step instructions are in [DEPLOYMENT.md](./DEPLOYMENT.md).
