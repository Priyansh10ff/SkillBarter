# Deploying Skill Barter

Three pieces: the **client** on Vercel, the **API** on Render, the **database** on MongoDB Atlas. Email goes through Gmail SMTP.

```
browser ──► Vercel (static client)
   │          └── /api/* rewritten to Render (same origin, no CORS for REST)
   └──────► Render (API + Socket.IO + PeerServer, one port)  ──► MongoDB Atlas
              wss://…/socket.io   wss://…/peerjs
```

Socket.IO and PeerJS connect straight to the Render URL (`VITE_SOCKET_URL`), so `CLIENT_URL` on Render must be the exact Vercel URL or the browser will be refused.

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

Production refuses to start without these, because sign-up depends on the verification email.

## 3. API: Render

1. New → **Blueprint**, pick the GitHub repo. Render reads `render.yaml` (root dir `server`, `npm ci --omit=dev`, `npm start`, health check `/health`).
2. Fill in the secrets it asks for:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Atlas connection string |
   | `EMAIL_USER` / `EMAIL_PASS` | Gmail address + app password |
   | `TURN_URL` / `TURN_USERNAME` / `TURN_CREDENTIAL` | optional, see below |

   `JWT_SECRET` is generated automatically. `PORT` is set by Render.
3. If your Vercel URL differs from `https://skill-barter-sigma.vercel.app`, change `CLIENT_URL`.
4. Deploy, then open `https://<service>.onrender.com/health`. Expect `{"status":"ok","db":"connected"}`.

Render's free tier sleeps after ~15 idle minutes; the first request after that takes 30–50 s. Bookings whose release time passed while asleep are completed as soon as it wakes.

**TURN (optional).** Video works peer to peer with public STUN for most networks. Users behind strict corporate or university networks may need a TURN relay. Any provider works (Metered, Twilio, or your own coturn); put its URL and credentials in the three `TURN_*` variables.

## 4. Client: Vercel

1. Import the repo. **Root directory** `client`, framework preset **Vite** (build `npm run build`, output `dist`).
2. Environment variables (Production):

   | Key | Value |
   |---|---|
   | `VITE_SOCKET_URL` | `https://<service>.onrender.com` |
   | `VITE_API_URL` | leave empty |

   These are also committed in `client/.env.production`; dashboard values win.
3. If the Render URL isn't `skillbarter-yew1.onrender.com`, update the `/api` rewrite in `client/vercel.json`.
4. Deploy.

## 5. After the first deploy

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

## 6. Rolling back

- **Client**: Vercel → Deployments → previous deployment → *Promote*.
- **API**: Render → Deploys → previous deploy → *Rollback*, or revert the commit.
- **Data**: Atlas M10+ has point-in-time restore; on M0, export with `mongodump` before risky changes.
