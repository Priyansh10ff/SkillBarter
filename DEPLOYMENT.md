# Skill Barter - Production Deployment Guide

This guide outlines the steps to deploy the Skill Barter application to a production environment, ensuring security, performance, and reliability.

## 1. Infrastructure Architecture

We recommend a **Separated Deployment Strategy**:
- **Frontend (Client):** Deployed on **Vercel** or **Netlify** (Global CDN, Auto-HTTPS).
- **Backend (Server):** Deployed on **Render**, **Railway**, or **Heroku** (Node.js runtime, Managed Database).
- **Database:** **MongoDB Atlas** (Managed, Auto-Scaling, Backups).

---

## 2. Environment Configuration

### Server Environment Variables (.env)
Ensure these are set in your backend hosting provider's dashboard:
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillbarter?retryWrites=true&w=majority
JWT_SECRET=<strong_random_string>
CLIENT_URL=https://<your-frontend-domain>.vercel.app
```

### Client Environment Variables
No `.env` is strictly required for the build if the API URL is relative or configured dynamically. However, if you are hardcoding the API URL in the client, use:
```bash
VITE_API_URL=https://<your-backend-domain>.onrender.com
```
*Note: You may need to update `axios` calls in the client to use this variable instead of `http://localhost:5000`.*

---

## 3. Deployment Steps

### A. Database (MongoDB Atlas)
1.  Create a Cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Whitelist `0.0.0.0/0` (or your server's static IP) in Network Access.
3.  Create a Database User.
4.  Get the Connection String for the `.env` file.

### B. Backend (Render/Railway)
1.  Connect your GitHub repository.
2.  Root Directory: `server`
3.  Build Command: `npm install`
4.  Start Command: `npm start`
5.  **Add Environment Variables** defined above.
6.  Wait for deployment. The health check endpoint is `/health`.

### C. Frontend (Vercel)
1.  Install Vercel CLI or use the Dashboard.
2.  Import the project from GitHub.
3.  Root Directory: `client`
4.  Framework Preset: **Vite**
5.  Build Command: `npm run build`
6.  Output Directory: `dist`
7.  Deploy.

---

## 4. Performance Optimization Checklist

- [x] **Gzip Compression**: Enabled on server via `compression` middleware.
- [x] **CDN**: Vercel automatically serves the frontend via a global Edge Network.
- [x] **Caching**: 
    - Frontend: Static assets hashed by Vite for aggressive caching.
    - Backend: `helmet` sets strict security headers.
- [x] **Asset Optimization**: Vite handles minification and tree-shaking during build.

## 5. Security Measures

- [x] **SSL/HTTPS**: Enforced by Vercel/Render automatically.
- [x] **Headers**: `helmet` middleware configured for HSTS, X-Frame-Options, etc.
- [x] **CORS**: Restricted to `CLIENT_URL` only.
- [x] **Logging**: `morgan` logging enabled for monitoring traffic anomalies.
- [ ] **Rate Limiting**: *Recommended addition for high-traffic endpoints.*

## 6. Maintenance & Monitoring

1.  **Uptime**: Use [UptimeRobot](https://uptimerobot.com/) to ping `<backend-url>/health` every 5 mins.
2.  **Logs**: Check Render/Heroku dashboard logs for `morgan` output.
3.  **Backups**: Enable "Cloud Backups" in MongoDB Atlas (auto-snapshots).

## 7. Rollback Procedure

In case of a critical failure:
1.  **Frontend**: Use Vercel's "Instant Rollback" to revert to the previous deployment.
2.  **Backend**: Revert the git commit and trigger a new build, or use the platform's rollback feature.
3.  **Database**: Restore from the latest MongoDB Atlas snapshot.
