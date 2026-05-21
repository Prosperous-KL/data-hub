# Deployment Guide

## Stack

- Database: Neon PostgreSQL
- Backend: Railway
- Frontend: Render

## 1) Neon Database

1. Create a project in Neon.
2. Copy the connection string.
3. Keep `sslmode=require` in the connection string.
4. Load `backend/database/schema.sql` into the Neon SQL editor.

Use the Neon connection string as `DATABASE_URL` in Railway.

## 2) Backend on Railway

1. Create a Railway project from this repository.
2. Set the root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `DATABASE_URL=<Neon connection string>`
   - `JWT_SECRET=<generated secret>`
   - `JWT_EXPIRES_IN=7d`
   - `PAYMENT_CALLBACK_TOKEN=<generated token>`
   - `CORS_ORIGIN=http://localhost:3000,https://your-frontend.onrender.com`
   - `APP_BASE_URL=https://your-backend.railway.app`

## 3) Frontend on Render

1. Create a Render Web Service from the same repository.
2. Set the root directory to `frontend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
   - `NEXT_PUBLIC_SITE_URL=https://your-frontend.onrender.com`

## 4) Final Wiring

1. Update `CORS_ORIGIN` in Railway to include the exact Render URL.
2. Confirm `APP_BASE_URL` points to the Railway service URL.
3. Redeploy Railway after updating variables.
4. Verify `GET /health` on Railway and the frontend login page on Render.

## 5) Helpful Files

- [DEPLOYMENT_STEPS.md](../DEPLOYMENT_STEPS.md)
- [DEPLOYMENT_QUICK_CARD.md](../DEPLOYMENT_QUICK_CARD.md)
- [backend/railway.template.env](../backend/railway.template.env)
- [frontend/.env.local.example](../frontend/.env.local.example)
