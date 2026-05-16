# Complete Deployment Guide: Supabase, Render & Vercel

## Overview
Deploy Data Hub to production using:
- **Database**: Supabase (PostgreSQL)
- **Backend**: Render (Node.js)
- **Frontend**: Vercel (Next.js)

---

## 1. SUPABASE SETUP (PostgreSQL Database)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign in with GitHub or create account
3. Click "New Project"
4. **Project Name**: `data-hub-prod`
5. **Database Password**: Create a strong password and **save it**
6. **Region**: Choose closest to Ghana (Europe is fine)
7. Click "Create new project" (wait 2-3 minutes)

### Step 2: Get Database Credentials
1. Go to **Settings** → **Database**
2. Copy the connection string (it looks like: `postgresql://user:password@...`)
3. You'll see variables:
   - **Host**: `db.xxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: The one you set

### Step 3: Create Database Schema
1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the content from `database/schema.sql`
4. Click **Run** (or press Ctrl+Enter)

### Step 4: Create `.env` file for Render
Save this as reference for next step:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

---

## 2. RENDER BACKEND DEPLOYMENT

### Step 1: Connect GitHub to Render
1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Select **Deploy an existing repository**
4. If not connected, click **Connect GitHub account**
5. Select `data-hub` repository
6. Select branch: `feat/hubtel-sms-otp-implementation` (or `main` when ready)

### Step 2: Configure Web Service
- **Name**: `data-hub-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

### Step 3: Set Environment Variables
Click **Environment** and add these:

| Key | Value | Source |
|-----|-------|--------|
| `NODE_ENV` | `production` | Fixed |
| `PORT` | `4000` | Fixed |
| `PAYMENT_PROVIDER` | `SIMULATED` | Fixed |
| `VTU_PROVIDER` | `SIMULATED` | Fixed |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` | **GENERATE NEW** |
| `DATABASE_URL` | From Supabase (Step 2.4) | Supabase |
| `PAYMENT_CALLBACK_TOKEN` | Generate: `openssl rand -hex 16` | **GENERATE NEW** |
| `SMTP_FROM_NAME` | `Prosperous Data Hub` | Fixed |

**Optional** (if you have credentials):
- `HUBTEL_SMS_CLIENT_ID`: Your Hubtel ID
- `HUBTEL_SMS_CLIENT_SECRET`: Your Hubtel Secret
- `SMTP_GMAIL_USER`: Your Gmail
- `SMTP_GMAIL_APP_PASSWORD`: Gmail app password

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Check **Logs** for any errors
4. Once deployed, you'll see a URL like: `https://data-hub-backend-xyz.onrender.com`

### Step 5: Test Backend
```bash
curl https://data-hub-backend-xyz.onrender.com/health
```
Should return: `{"status":"ok"}`

---

## 3. VERCEL FRONTEND DEPLOYMENT

### Step 1: Connect GitHub to Vercel
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Select `data-hub` repository
4. Import project

### Step 2: Configure Project
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 3: Set Environment Variables
Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://data-hub-backend-xyz.onrender.com`) |
| `NEXT_PUBLIC_APP_NAME` | `Prosperous Data Hub` |

### Step 4: Deploy
1. Click **Deploy**
2. Wait for deployment (3-5 minutes)
3. Check build logs for errors
4. Once complete, you'll get a URL like: `https://data-hub-xyz.vercel.app`

### Step 5: Test Frontend
Visit: `https://data-hub-xyz.vercel.app`
- Check console for errors (F12)
- Try logging in at `/auth/login`
- Try registering at `/auth/register`

---

## 4. CONNECT BACKEND & FRONTEND

### Update CORS on Render
1. Go to Render dashboard → Environment
2. Update `CORS_ORIGIN`:
```
http://localhost:3000,https://data-hub-xyz.vercel.app
```
3. Click **Save, rebuild, and deploy**

### Update Frontend API URL (if needed)
1. In Vercel, go to Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to match Render backend URL
3. Redeploy

---

## 5. PRODUCTION CHECKLIST

- [ ] Database created and schema imported in Supabase
- [ ] Backend deployed to Render with all env vars set
- [ ] Frontend deployed to Vercel
- [ ] CORS configured to allow frontend domain
- [ ] `/health` endpoint responds on backend
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can request OTP (email or SMS)
- [ ] Can verify OTP
- [ ] Dashboard loads after auth
- [ ] Session persists on page refresh

---

## 6. MONITORING & TROUBLESHOOTING

### Backend Logs (Render)
- Go to Dashboard → Logs
- Search for errors
- Check for 500 status codes

### Frontend Logs (Vercel)
- Browser DevTools (F12) → Console
- Vercel Analytics → check for 4xx/5xx errors

### Database Connection Issues
- Check `DATABASE_URL` format
- Verify Supabase firewall rules (should allow all)
- Test connection with: `psql <DATABASE_URL>`

### CORS Errors
- Check browser console for "CORS" errors
- Update `CORS_ORIGIN` in Render env variables
- Don't forget to redeploy

---

## 7. GENERATE SECRETS

Use these commands to generate secure secrets:

```bash
# JWT Secret (32+ chars recommended)
openssl rand -hex 32

# Payment Callback Token (16+ chars)
openssl rand -hex 16

# On Windows (PowerShell):
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32|ForEach-Object{[char](Get-Random -Minimum 33 -Maximum 127)})-join''))
```

---

## 8. DOMAIN SETUP (Optional)

To use custom domain like `app.yourcompany.com`:

### For Frontend (Vercel)
1. Go to Vercel → Settings → Domains
2. Add domain and follow DNS instructions

### For Backend (Render)
1. Go to Render → Settings → Custom Domains
2. Add domain and follow DNS instructions

---

## 9. GITHUB INTEGRATION

### Setting up Auto-Deploy
1. **Render**: Connects automatically when you select the branch
2. **Vercel**: Connects automatically, deploys on push to main

### Deployment Workflow
```bash
# Make changes locally
git add .
git commit -m "Feature: Add new endpoint"

# Push to GitHub
git push origin feat/hubtel-sms-otp-implementation

# Create Pull Request to main when ready
# Once merged to main, Render and Vercel auto-deploy
```

---

## 10. ROLLBACK PROCEDURE

If deployment breaks:

### Render
1. Go to Deploys tab
2. Find previous working deployment
3. Click "Redeploy"

### Vercel
1. Go to Deployments
2. Find previous working deployment
3. Click "Redeploy"

---

## Quick Command Reference

```bash
# Generate JWT secret
openssl rand -hex 32

# Test backend health
curl -X GET https://data-hub-backend-xyz.onrender.com/health

# Check frontend build
npm run build --prefix frontend

# View logs
# Render: Dashboard → Logs
# Vercel: Dashboard → Deployments → [Deploy] → Logs
```

---

## Support & Documentation

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Node.js Express**: https://expressjs.com
- **Next.js**: https://nextjs.org/docs

---

## Next Steps After Deployment

1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domain
3. Set up SSL certificates
4. Enable analytics
5. Configure email notifications
6. Set up backup strategy for database
7. Create maintenance windows
8. Document API for mobile/external apps
