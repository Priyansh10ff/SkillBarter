# Skill Barter: Deployment Guide

How to put Skill Barter online on free tiers, check that it works, and keep it running.

| Piece | Platform | Live |
|---|---|---|
| Database | MongoDB Atlas (M0 free cluster) | |
| API (`server/`) | Render web service (free) | `https://skillbarter-ppj7.onrender.com` |
| Web app (`client/`) | Vercel (Hobby) | `https://skillbarter-web.vercel.app` |

```
browser ──► Vercel (static client)
   │
   └──────► Render (REST + Socket.IO + PeerServer, one port)  ──► MongoDB Atlas
              https://…/api   wss://…/socket.io   wss://…/peerjs
```

Two settings connect the halves. Nothing in the code needs editing:

| Where | Setting | Value |
|---|---|---|
| Vercel | `VITE_SERVER_URL` | the Render URL |
| Render | `CLIENT_URL` | the Vercel URL. CORS refuses every other origin |

Each one needs the other's URL, so deploy in this order: **Atlas → Render → Vercel → back to Render to set `CLIENT_URL`**.

---

## 1. Database: MongoDB Atlas

1. Create an **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas). Pick the region closest to your Render region. Atlas clusters are replica sets, which the credit ledger needs for transactions.
2. **Database Access → Add New Database User.** Use password auth with *Read and write to any database*. Keep the password. If it has special characters (`@ : / ? #`), URL-encode them in the connection string.
3. **Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`).** Render's free tier has no fixed outbound IP. The database is still protected by the user and password.
4. **Connect → Drivers**, copy the string, and add the database name before the `?`:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillbarter?retryWrites=true&w=majority
   ```

   Without a name, MongoDB uses a database called `test`. That works, but it's easy to mix up later.

This is your `MONGO_URI`.

## 2. API: Render

1. Push the repo to GitHub.
2. Render → **New → Blueprint** → pick the repo. It reads `render.yaml`:

   | Setting | Value |
   |---|---|
   | Root directory | `server` |
   | Build | `npm ci --omit=dev` |
   | Start | `npm start` |
   | Health check | `/health` |
   | Node | 22 |

3. Fill in the variables it asks for:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | from step 1 |
   | `CLIENT_URL` | `http://localhost:5173` for now. You'll replace it in step 4 |
   | `TURN_*` | leave empty unless you have a TURN provider (see [TURN](#turn-relay-optional)) |

   `NODE_ENV=production`, `NODE_VERSION=22` and `JWT_EXPIRES_IN=7d` come from the blueprint. `JWT_SECRET` is generated for you. If you create the service by hand instead, generate one with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Don't set `PORT`. Render provides it.

4. Deploy, then open `https://<service>.onrender.com/health`. You should see:

   ```json
   { "status": "ok", "db": "connected" }
   ```

   Opening `/` shows `{"message":"Not found: GET /"}`. That's expected, because the API has no home page.

## 3. Web app: Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Project name** sets the URL (`<name>.vercel.app`).
3. **Root Directory**: `client`. The framework preset is **Vite** (build `npm run build`, output `dist`).
4. **Environment Variables**: `VITE_SERVER_URL` = the Render URL from step 2, with no trailing slash.
5. Deploy and copy the production URL.

`VITE_SERVER_URL` is baked in at build time. If you change it, redeploy.

## 4. Connect them

1. Render → service → **Environment** → set `CLIENT_URL` to the Vercel URL exactly (`https://…`, no trailing slash).
2. Save. Render redeploys on its own.
3. Open the Vercel URL. The landing page loads the "Open sessions" board, which is empty until someone posts. If the browser console shows CORS errors, `CLIENT_URL` doesn't match the address in the browser bar.

If you add a custom domain later, put that domain in `CLIENT_URL`.

## 5. After the first deploy

1. **Sign up** on the live site with your own email and finish onboarding.
2. **Make yourself an admin**, so you can resolve reported sessions. Point `MONGO_URI` in your local `server/.env` at the production database, then:

   ```bash
   cd server
   npm run make-admin -- you@example.com
   ```

3. **Smoke test** with two accounts in two browsers:

   - [ ] sign up → logged straight in → onboarding → 2 credits in the wallet
   - [ ] post a session from account A. It appears on the landing board and in search
   - [ ] book it from account B. B's wallet shows 1 credit *held*, and A gets a live notification
   - [ ] propose a time ~6 minutes ahead from one side and accept from the other
   - [ ] join the room from both. Video connects, screen share works, whiteboard and chat sync
   - [ ] B confirms the session. A receives the credits (wallet + notification)
   - [ ] both leave reviews. Rating, badges and leaderboard update
   - [ ] cancel a second pending booking. B is refunded in full

## 6. Operations

| Task | How |
|---|---|
| Logs | Render → service → **Logs**. Requests are logged in combined format, and errors with stack traces |
| Uptime and cold starts | The free instance sleeps after ~15 idle minutes, and the first request then takes 30 to 50 s. Point a free uptime monitor (e.g. UptimeRobot) at `/health` every 10 minutes, or move to a paid instance |
| Change an env var | Render → Environment → Save, and it redeploys. On Vercel, change it and then **Redeploy** |
| Resolve a reported session | `GET /api/admin/disputes`, then `POST /api/admin/disputes/<bookingId>/resolve` with `{ "outcome": "release" }` or `"refund"`, using an admin's Bearer token |
| Wipe all data | With `server/.env` pointing at the database and `NODE_ENV` not `production`: `npm run reset` empties every collection |
| Back up | M0 has no automated backups. Run `mongodump --uri "<MONGO_URI>"` before risky changes |
| Rotate `JWT_SECRET` | Change it on Render. Everyone is logged out, and open room links get new peer IDs |

### TURN relay (optional)

Video works peer to peer with public STUN on most networks. Strict corporate or campus networks may need a TURN relay (Metered, Twilio or your own coturn). Put its URL and credentials in `TURN_URL`, `TURN_USERNAME` and `TURN_CREDENTIAL`, and the room hands them to both browsers.

### Email

The app currently sends no email. Render's free tier blocks outbound SMTP ports (25, 465, 587), so Gmail SMTP hangs there. If you add email, use an HTTPS email API (Brevo, Resend, Postmark) rather than SMTP, or move to a paid Render instance.

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Render deploy exits with `JWT_SECRET must be at least 16 characters` or `CLIENT_URL: Invalid URL` | Missing or malformed env var. The server validates its environment at startup | Set the variable properly in Render → Environment |
| `/health` returns `503` or the deploy fails on MongoDB | Wrong `MONGO_URI`, password not URL-encoded, or Atlas network access not `0.0.0.0/0` | Check all three in Atlas |
| `querySrv ECONNREFUSED` when running scripts locally | Your network's DNS can't resolve `mongodb+srv` records | Add `DNS_SERVERS=1.1.1.1,8.8.8.8` to your local `server/.env` (not needed on Render) |
| Browser shows CORS errors, or nothing loads after login | `CLIENT_URL` doesn't exactly match the site's origin | Same scheme and host, no trailing slash, then redeploy |
| Site calls `localhost:5000` in production | `VITE_SERVER_URL` wasn't set when Vercel built | Set it and **Redeploy** |
| First request takes ~50 s | Render free instance waking up | Expected. Use an uptime ping (section 6) |
| Room keeps saying "Waiting for <name> to join" although both are in | Peer-to-peer blocked by a strict NAT or firewall | Configure a TURN relay |
| Camera light stays on after leaving | Browser didn't release the device | Reload the tab. Leaving the room normally stops every track |
| A request hangs on an email-related step | SMTP blocked on Render's free tier | See [Email](#email) |

## 8. Rolling back

- **Client:** Vercel → Deployments → a previous deployment → **Promote to Production**.
- **API:** Render → Deploys → a previous deploy → **Rollback**, or revert the commit and push.
- **Data:** Atlas M10+ has point-in-time restore. On M0, restore from your last `mongodump` with `mongorestore`.
