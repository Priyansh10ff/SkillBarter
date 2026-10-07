# Deploying Skill Barter

Three pieces: the **client** on Vercel, the **API** on Render, the **database** on MongoDB Atlas. Email goes through Gmail SMTP.

```
browser ──► Vercel (static client)
   │
   └──────► Render (REST + Socket.IO + PeerServer, one port)  ──► MongoDB Atlas
              https://…/api   wss://…/socket.io   wss://…/peerjs
```

Two settings point the halves at each other, and nothing in the code needs editing:

| Where | Setting | Value |
|---|---|---|
| Vercel | `VITE_SERVER_URL` | the Render URL |
| Render | `CLIENT_URL` | the Vercel URL (CORS: anything else is refused) |

Because each needs the other's URL, deploy in this order: Atlas → Render → Vercel → back to Render to set `CLIENT_URL`.

---

## 1. Database: MongoDB Atlas

1. Create a cluster. The free M0 tier works. Atlas clusters are replica sets, which the credit ledger needs for transactions; a standalone `mongod` will not work.
2. **Database Access**: create a user with read/write on the `skillbarter` database.
3. **Network Access**: allow `0.0.0.0/0` (Render's free tier has no fixed outbound IP).
4. Copy the connection string:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillbarter?retryWrites=true&w=majority`

## 2. Email: Gmail app password

1. Turn on 2-step verification for the Gmail account that will send mail.
2. Create an app password at https://myaccount.google.com/apppasswords.
3. Use the account as `EMAIL_USER` and the 16-character app password as `EMAIL_PASS`.

Without these the server still runs, but emails (including verification links) are only printed to the Render logs, so set them before real users sign up.

## 3. API: Render

1. Render → **New → Blueprint** → pick the GitHub repo. It reads `render.yaml`: root dir `server`, build `npm ci --omit=dev`, start `npm start`, health check `/health`, Node 22.
2. Fill in what it asks for:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Atlas connection string |
   | `EMAIL_USER` / `EMAIL_PASS` | Gmail address + app password |
   | `CLIENT_URL` | `http://localhost:5173` for now; you'll replace it in step 5 |
   | `TURN_*` | leave empty unless you have a TURN provider (see below) |

   `JWT_SECRET` is generated for you. `PORT` is set by Render.
3. Deploy. Copy the service URL, e.g. `https://skill-barter-server-abcd.onrender.com`.
4. Open `<that URL>/health`. Expect `{"status":"ok","db":"connected"}`.

Render's free tier sleeps after ~15 idle minutes; the first request after that takes 30–50 s. Bookings whose release time passed while it slept are completed as soon as it wakes.

**TURN (optional).** Video works peer to peer with public STUN on most networks. Strict corporate or campus networks may need a TURN relay (Metered, Twilio, or your own coturn); put its URL and credentials in the three `TURN_*` variables.

## 4. Client: Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory**: `client`. Framework preset **Vite** (build `npm run build`, output `dist`).
3. **Environment Variables**: `VITE_SERVER_URL` = the Render URL from step 3.3 (no trailing slash).
4. Deploy. Copy the production URL, e.g. `https://skill-barter.vercel.app`.

`VITE_SERVER_URL` is baked in at build time: if you change it later, redeploy.

## 5. Connect them

1. Render → your service → **Environment** → set `CLIENT_URL` to the Vercel URL, exactly (`https://…`, no trailing slash).
2. Save. Render redeploys on its own.
3. Open the Vercel URL. The landing page should load with "Open sessions" (empty until someone posts). If the browser console shows CORS errors, `CLIENT_URL` doesn't match the address in the browser bar.

If you add a custom domain later, put that domain in `CLIENT_URL` instead.

## 6. After the first deploy

1. Sign up with your own email, verify, finish onboarding.
2. Make yourself an admin so you can resolve reported problems. With `MONGO_URI` pointing at production in `server/.env`:
   ```bash
   cd server
   npm run make-admin -- you@example.com
   ```
3. Smoke test with two accounts (two browsers):
   - [ ] sign up → verification email arrives → link logs you in → onboarding
   - [ ] post a skill; it appears on the landing board and in search
   - [ ] book it from the other account; balances show `held`
   - [ ] propose and accept a time ~6 minutes ahead; both get notifications
   - [ ] join the room from both; video connects, whiteboard and chat sync
   - [ ] confirm the session; teacher receives the hours (wallet + email)
   - [ ] both leave reviews; rating and badges update

`npm run seed` and `npm run reset` refuse to run with `NODE_ENV=production`.

## 7. Rolling back

- **Client**: Vercel → Deployments → previous deployment → *Promote*.
- **API**: Render → Deploys → previous deploy → *Rollback*, or revert the commit.
- **Data**: Atlas M10+ has point-in-time restore; on M0, export with `mongodump` before risky changes.
