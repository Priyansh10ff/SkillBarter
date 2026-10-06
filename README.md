# Skill Barter

Peer-to-peer skill exchange on time credits. Teach for an hour, earn a credit. Spend it to learn from someone else. No money involved.

- Product overview: [docs/PRODUCT.md](docs/PRODUCT.md)
- Technical reference: [docs/TECHNICAL.md](docs/TECHNICAL.md)
- Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Structure

```
client/   React + Vite frontend (Vercel)
server/   Express + MongoDB + Socket.IO API (Render)
docs/     Product, technical and deployment docs
```

## Run locally

Needs Node 22+ and a MongoDB replica set (an Atlas free cluster works).

```bash
# API
cd server
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET; leave EMAIL_* empty to print emails in the terminal
npm install
npm run seed              # optional: 6 demo accounts, password "password123"
npm run dev               # http://localhost:5000

# Frontend (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

| Command (in `server/`) | Does |
|---|---|
| `npm test` | API tests on an in-memory database |
| `npm run seed` | Demo users, listings, sessions and reviews (`-- --reset` wipes first) |
| `npm run make-admin -- you@example.com` | Lets that account resolve reported problems |
| `npm run reset` | Wipes all app data (refuses in production) |

Deploying: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
