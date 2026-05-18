# Quick Deployment Guide: Render + Vercel

**Status**: Code pushed to GitHub ✅  
**Repository**: https://github.com/Prosperous-TechPro/data-hub  
**Branch**: feat/hubtel-sms-otp-implementation

---

## 🚀 Step 1: Deploy Backend to Render

### Prerequisites
- Render account (https://render.com)
- GitHub account with access to the repository

### Deploy Backend
1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Click **Deploy an existing repository**
4. Connect your GitHub account if not already connected
5. Select repository: `data-hub`
6. Click **Connect**

### Configure Backend Service
- **Name**: `data-hub-backend`
- **Environment**: `Node`
- **Branch**: `feat/hubtel-sms-otp-implementation`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Choose a plan (Free tier available for testing)

### Add Environment Variables
Click **Environment** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Fixed |
| `PORT` | `4000` | Fixed |
| `JWT_SECRET` | Generate using: `openssl rand -hex 32` | **GENERATE NEW - SECURE** |
| `JWT_EXPIRES_IN` | `7d` | Fixed |
| `DATABASE_URL` | `postgresql://...` | Get from your PostgreSQL host (Neon/Supabase) |
| `CORS_ORIGIN` | `http://localhost:3000,https://your-vercel-frontend.vercel.app` | Update with your frontend URL after Vercel deployment |
| `APP_BASE_URL` | Leave empty for now | Will be your Render service URL after deployment |
| `PAYMENT_PROVIDER` | `SIMULATED` | Use SIMULATED for testing |
| `PAYMENT_CALLBACK_TOKEN` | Generate using: `openssl rand -hex 16` | **GENERATE NEW** |
| `PAYMENT_CALLBACK_PROVIDER` | `AUTO` | Fixed |
| `HUBTEL_BASE_URL` | `https://api.hubtel.com` | Fixed |
| `HUBTEL_SMS_BASE_URL` | `https://smsc.hubtel.com/v1/messages/send` | Fixed |
| `VTU_PROVIDER` | `SIMULATED` | Use SIMULATED for testing |
| `SMTP_FROM_NAME` | `Prosperous Data Hub` | Fixed |
| `ADMIN_EMAIL` | `your-email@example.com` | Your admin email |

**Optional credentials** (if you have them):
- `HUBTEL_SMS_CLIENT_ID`: Your Hubtel SMS ID
- `HUBTEL_SMS_CLIENT_SECRET`: Your Hubtel SMS secret
- `HUBTEL_CLIENT_ID`: Your Hubtel payment client ID
- `HUBTEL_CLIENT_SECRET`: Your Hubtel payment secret
- `HUBTEL_SIGNING_SECRET`: Your Hubtel signing secret
- `SMTP_GMAIL_USER`: Your Gmail address
- `SMTP_GMAIL_APP_PASSWORD`: Gmail app-specific password
- `VTU_API_KEY`: Your VTU provider API key (if using REAL provider)
- `VTU_BASE_URL`: Your VTU provider base URL

### Deploy
1. Click **Create Web Service**
2. Wait 5-10 minutes for deployment
3. Check logs for errors
4. Once deployed, you'll see a URL like: `https://data-hub-backend-xxxxx.onrender.com`
5. Test health: `curl https://data-hub-backend-xxxxx.onrender.com/health`

**✅ Copy your backend URL** - you'll need it for frontend deployment

---

## 🚀 Step 2: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with access to the repository

### Deploy Frontend
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Connect your GitHub account if needed
5. Select repository: `data-hub`
6. Click **Import**

### Configure Frontend
- **Project Name**: `data-hub-frontend`
- **Framework Preset**: Next.js (auto-selected)
- **Root Directory**: `frontend` (important!)

### Add Environment Variables
Add these before deploying:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://data-hub-backend-xxxxx.onrender.com` | Replace with your backend URL from Step 1 |

### Deploy
1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Once deployed, you'll see your frontend URL: `https://your-project.vercel.app`

**✅ Copy your frontend URL** - you'll need it for backend CORS configuration

---

## 🔄 Step 3: Update Backend CORS Configuration

Go back to Render dashboard:

1. Open your `data-hub-backend` service
2. Click **Environment**
3. Update `CORS_ORIGIN`: Add your Vercel frontend URL
   ```
   http://localhost:3000,https://your-project.vercel.app
   ```
4. Update `APP_BASE_URL`: Set to your Render service URL
   ```
   https://data-hub-backend-xxxxx.onrender.com
   ```
5. Click **Save**
6. Backend will automatically redeploy

---

## ✅ Step 4: Verify Deployments

### Test Backend
```bash
curl https://data-hub-backend-xxxxx.onrender.com/health
# Should return: {"status":"ok"}
```

### Test Frontend
1. Open `https://your-project.vercel.app` in browser
2. You should see the login page
3. Try registering a test account
4. Verify you can log in

---

## 📋 Database Setup

If you need to set up a PostgreSQL database:

### Option A: Use Neon (Free PostgreSQL)
1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Render environment as `DATABASE_URL`
5. Run migrations (if needed)

### Option B: Use Supabase (PostgreSQL + Real-time)
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings → Database
4. Add to Render environment as `DATABASE_URL`

### Option C: Use existing database
1. Ensure SSL is enabled on your database
2. Update `DATABASE_URL` in Render environment

---

## 🔐 Security Checklist

- [ ] Generate new `JWT_SECRET` (32+ characters)
- [ ] Generate new `PAYMENT_CALLBACK_TOKEN` (16+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain only
- [ ] Use strong, unique admin email credentials
- [ ] Enable HTTPS (Render and Vercel do this automatically)
- [ ] Regularly rotate secrets
- [ ] Monitor error logs in Render dashboard

---

## 🐛 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Ensure `DATABASE_URL` is correct
- Verify all required env vars are set
- Check database connection

### Frontend deployment fails
- Ensure root directory is set to `frontend`
- Check build logs in Vercel
- Verify `NEXT_PUBLIC_API_URL` is correct

### CORS errors
- Add your Vercel frontend URL to backend `CORS_ORIGIN`
- Restart/redeploy backend after updating

### Login/auth issues
- Verify backend is running: `/health` endpoint
- Check `NEXT_PUBLIC_API_URL` matches actual backend URL
- Review backend logs for errors

---

## 📞 Support

For help:
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- GitHub issues: https://github.com/Prosperous-TechPro/data-hub/issues
