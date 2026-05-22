# Quick Deployment Guide: Neon + Railway + Render

**Status**: Code pushed to GitHub
**Repository**: https://github.com/Prosperous-TechPro/data-hub
**Branch**: feat/hubtel-sms-otp-implementation

---

## Step 1: Create Neon PostgreSQL

### Prerequisites
- Neon account: https://neon.tech
- GitHub account with access to the repository

### Create the database
1. Go to https://console.neon.tech
2. Click **New Project**
3. Create the project and copy the connection string
4. Keep `sslmode=require` in the connection string

### Load the schema
1. Open the Neon SQL editor
2. Paste `backend/database/schema.sql`
3. Run the script

### Save the connection string
Use the Neon connection string as `DATABASE_URL` in Railway.

---

## Step 2: Deploy Backend to Railway

### Prerequisites
- Railway account: https://railway.app

### Deploy backend
1. Go to https://railway.app/dashboard
2. Click **New Project** → **Deploy from GitHub repo**
3. Select repository: `data-hub`
4. Choose the `backend` root directory

### Configure the service
- **Service Name**: `data-hub-backend`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Add environment variables
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | Neon connection string with `sslmode=require` |
| `JWT_SECRET` | Generated secret |
| `JWT_EXPIRES_IN` | `7d` |
| `PAYMENT_CALLBACK_TOKEN` | Generated token |
| `CORS_ORIGIN` | `http://localhost:3000,https://your-frontend.onrender.com` |
| `APP_BASE_URL` | `https://your-backend.railway.app` |

### Deploy
1. Click **Deploy**
2. Wait for the build to finish
3. Copy your Railway backend URL

### Test backend
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok"}
```

---

## Step 3: Deploy Frontend to Render

### Prerequisites
- Render account: https://render.com

### Deploy frontend
1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Select **Deploy an existing repository**
4. Select repository: `data-hub`
5. Set the root directory to `frontend`

### Configure the service
- **Name**: `data-hub-frontend`
- **Environment**: `Node`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Add environment variables
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL |
| `NEXT_PUBLIC_SITE_URL` | Your Render frontend URL, or set after the first deploy |

### Deploy
1. Click **Create Web Service**
2. Wait for the build and deploy to complete
3. Copy your Render frontend URL

### Test frontend
1. Open `https://your-frontend.onrender.com` in a browser
2. You should see the login page
3. Try registering a test account
4. Verify you can log in

---

## Step 4: Update Backend CORS

Go back to Railway:

1. Open your `data-hub-backend` service
2. Click **Variables**
3. Update `CORS_ORIGIN`:
   ```
   http://localhost:3000,https://your-frontend.onrender.com
   ```
4. Update `APP_BASE_URL`:
   ```
   https://your-backend.railway.app
   ```
5. Save the variables and let Railway redeploy

---

## Database Options

### Option A: Use Neon
1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. Add it to Railway as `DATABASE_URL`
5. Load `backend/database/schema.sql` if you have not already

### Option B: Use existing PostgreSQL
1. Ensure SSL is enabled on your database
2. Update `DATABASE_URL` in Railway variables

---

## Security Checklist

- [ ] Generate a new `JWT_SECRET` with 32+ characters
- [ ] Generate a new `PAYMENT_CALLBACK_TOKEN`
- [ ] Set `NODE_ENV=production`
- [ ] Restrict `CORS_ORIGIN` to the Render frontend domain
- [ ] Use HTTPS for both public URLs
- [ ] Rotate secrets regularly

---

## Troubleshooting

### Backend will not start
- Check Railway logs
- Verify `DATABASE_URL`
- Verify `JWT_SECRET` and `PAYMENT_CALLBACK_TOKEN`

### Frontend deployment fails
- Ensure the root directory is set to `frontend`
- Check Render build logs
- Verify `NEXT_PUBLIC_API_URL`

### CORS errors
- Add the Render frontend URL to `CORS_ORIGIN`
- Redeploy the Railway backend

### Login or auth issues
- Verify the Railway backend health endpoint
- Confirm `NEXT_PUBLIC_API_URL` matches the Railway service URL

---

## Support

- Neon docs: https://neon.tech/docs
- Railway docs: https://docs.railway.com
- Render docs: https://render.com/docs