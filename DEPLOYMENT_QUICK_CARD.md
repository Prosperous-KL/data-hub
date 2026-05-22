# 🚀 DEPLOYMENT QUICK REFERENCE CARD

## Current Status
✅ Code pushed to GitHub: https://github.com/Prosperous-TechPro/data-hub  
✅ Branch: `feat/hubtel-sms-otp-implementation`

---

## 1) Generate Required Secrets

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Use the first output for `JWT_SECRET` and the second for `PAYMENT_CALLBACK_TOKEN`.

---

## 2) Create Neon PostgreSQL

1. Go to https://console.neon.tech
2. Create a project
3. Copy the connection string
4. Keep `sslmode=require`
5. Load `backend/database/schema.sql`

Use the Neon connection string as `DATABASE_URL`.

---

## 3) Deploy Backend to Railway

1. Go to https://railway.app/dashboard
2. Create a new project from the GitHub repo
3. Set the root directory to `backend`
4. Use `npm install` as the build command
5. Use `npm start` as the start command

### Backend Variables
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Generated secret |
| `PAYMENT_CALLBACK_TOKEN` | Generated token |
| `CORS_ORIGIN` | `http://localhost:3000,https://your-frontend.onrender.com` |
| `APP_BASE_URL` | Railway backend URL |

---

## 4) Deploy Frontend to Render

1. Go to https://dashboard.render.com
2. Create a new Web Service from the repo
3. Set the root directory to `frontend`
4. Use `npm install && npm run build`
5. Use `npm start`

### Frontend Variables
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Railway backend URL |
| `NEXT_PUBLIC_SITE_URL` | Render frontend URL |

---

## 5) Final Backend Update

1. Update `CORS_ORIGIN` in Railway to include the Render URL
2. Confirm `APP_BASE_URL` points to the Railway service URL
3. Redeploy Railway

---

## Verification

- [ ] `curl https://your-backend.railway.app/health` returns OK
- [ ] Frontend loads on Render
- [ ] Login and register flows work
- [ ] Browser console has no CORS errors

---

## Troubleshooting

- `DATABASE_URL` errors: verify Neon connection string and `sslmode=require`
- CORS errors: update `CORS_ORIGIN` to the Render URL and redeploy Railway
- Frontend network errors: verify `NEXT_PUBLIC_API_URL`
