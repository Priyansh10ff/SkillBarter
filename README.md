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

```bash
# API
cd server
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS
npm install
npm run dev               # http://localhost:5000

# Frontend (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```
