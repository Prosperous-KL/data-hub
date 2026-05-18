# 🚀 DEPLOYMENT QUICK REFERENCE CARD

## Current Status
✅ Code pushed to GitHub: https://github.com/Prosperous-TechPro/data-hub  
✅ Branch: `feat/hubtel-sms-otp-implementation`  
✅ All tests passing (14 E2E tests ✓)  

---

## 🔑 Required Credentials to Generate

Before deploying, generate these security tokens:

### Generate JWT_SECRET (32+ chars)
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Save this value** ⬇️

### Generate PAYMENT_CALLBACK_TOKEN (16+ chars)
```powershell
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
**Save this value** ⬇️

---

## 📋 STEP 1: Deploy Backend to Render

**URL**: https://dashboard.render.com

### Login
1. Click **GitHub** button
2. Authorize Render to access your repositories

### Create Backend Service
1. Click **New** → **Web Service**
2. Click **Deploy an existing repository**
3. Select `data-hub` repo
4. Click **Connect**

### Configure Service
- **Service Name**: `data-hub-backend`
- **Environment**: Node
- **Branch**: `feat/hubtel-sms-otp-implementation`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Set Environment Variables
Click **Environment** and add:

**REQUIRED:**
| Key | Value |
|-----|-------|
| NODE_ENV | `production` |
| PORT | `4000` |
| JWT_SECRET | *Your generated secret* ⬆️ |
| PAYMENT_CALLBACK_TOKEN | *Your generated token* ⬆️ |
| DATABASE_URL | Your PostgreSQL connection string |
| ADMIN_EMAIL | your-email@example.com |

**OPTIONAL (Fixed Values):**
| Key | Value |
|-----|-------|
| JWT_EXPIRES_IN | `7d` |
| CORS_ORIGIN | `http://localhost:3000` (update after Vercel) |
| APP_BASE_URL | Leave blank (fill after deployment) |
| PAYMENT_PROVIDER | `SIMULATED` |
| PAYMENT_CALLBACK_PROVIDER | `AUTO` |
| VTU_PROVIDER | `SIMULATED` |
| SMTP_FROM_NAME | `Prosperous Data Hub` |
| HUBTEL_BASE_URL | `https://api.hubtel.com` |
| HUBTEL_SMS_BASE_URL | `https://smsc.hubtel.com/v1/messages/send` |

### Deploy
1. Click **Create Web Service**
2. Wait 5-10 minutes
3. Once deployed, copy your backend URL: `https://data-hub-backend-xxxxx.onrender.com`

### Test Backend
```bash
curl https://data-hub-backend-xxxxx.onrender.com/health
# Should return: {"status":"ok"}
```

---

## 📋 STEP 2: Deploy Frontend to Vercel

**URL**: https://vercel.com/dashboard

### Login
1. Click **Continue with GitHub**
2. Authorize Vercel

### Import Project
1. Click **Add New** → **Project**
2. Click **Import Git Repository**
3. Find and select `data-hub`
4. Click **Import**

### Configure Project
- **Project Name**: `data-hub-frontend`
- **Framework Preset**: Next.js *(auto-selected)*
- **Root Directory**: `frontend` ⚠️ **IMPORTANT**

### Add Environment Variable
Before deploying, click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_API_URL | `https://data-hub-backend-xxxxx.onrender.com` |

*Use your backend URL from Step 1*

### Deploy
1. Click **Deploy**
2. Wait 2-5 minutes
3. Once deployed, copy your frontend URL: `https://data-hub-xxxxx.vercel.app`

---

## 📋 STEP 3: Update Backend CORS

Go back to Render dashboard:

1. Open `data-hub-backend` service
2. Click **Environment**
3. Update `CORS_ORIGIN`:
   ```
   http://localhost:3000,https://data-hub-xxxxx.vercel.app
   ```
4. Update `APP_BASE_URL`:
   ```
   https://data-hub-backend-xxxxx.onrender.com
   ```
5. Click **Save**
6. Backend will auto-redeploy

---

## ✅ VERIFICATION CHECKLIST

### Backend Tests
- [ ] Health check returns OK: `curl https://data-hub-backend-xxxxx.onrender.com/health`
- [ ] Check logs in Render dashboard for errors
- [ ] Database connection working

### Frontend Tests
- [ ] Open https://data-hub-xxxxx.vercel.app
- [ ] Login page loads
- [ ] Try to register a test account
- [ ] Try to log in
- [ ] Check browser console for errors

### Integration Tests
- [ ] Dashboard loads after login
- [ ] API calls are reaching backend
- [ ] Check browser Network tab in DevTools

---

## 🐛 TROUBLESHOOTING

### "Cannot find DATABASE_URL"
- Add `DATABASE_URL` to Render environment variables
- Format: `postgresql://user:pass@host:5432/dbname`

### "CORS error in browser"
- Update `CORS_ORIGIN` in Render to include Vercel URL
- Redeploy backend after updating

### "Cannot connect to backend"
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches actual backend URL
- Check that backend is running (health check)
- Check browser console for actual error message

### "Database connection timeout"
- Ensure DATABASE_URL includes `?sslmode=require` for cloud databases
- Verify database firewall allows Render IP

---

## 📚 DOCUMENTATION

Full guides available in repo:
- [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md) - Detailed walkthrough
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Complete deployment guide
- [docs/PRODUCTION_READY.md](docs/PRODUCTION_READY.md) - Production checklist

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. Monitor logs for 24 hours
2. Set up error tracking (Sentry)
3. Configure automated backups
4. Set up monitoring and alerts
5. Test complete user flows
6. Plan maintenance windows
