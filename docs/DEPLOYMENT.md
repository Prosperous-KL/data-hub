# Deployment Guide (Production)

## 1) PostgreSQL Setup

1. Create database:

```sql
CREATE DATABASE prosperous_data_hub;
```

2. Apply schema:

```bash
psql -U postgres -d prosperous_data_hub -f database/schema.sql
```

3. Ensure DB accepts SSL connections if deploying on managed host.

## 2) Backend Deployment (Node.js + PM2 + Nginx)

1. Copy backend env and set values:

```bash
cd backend
cp .env.example .env
```

2. Install and start:

```bash
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

3. Nginx reverse proxy sample:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Enable HTTPS with Certbot:

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Render (Recommended for this project)

1. Create a new Web Service in Render and connect this repository.
2. Set **Root Directory** to `backend`.
3. Set commands:
    - Build Command: `npm install`
    - Start Command: `npm start`
4. Set **Health Check Path** to `/health`.
5. Add required environment variables:
    - `DATABASE_URL`
    - `JWT_SECRET` (16+ chars, recommended 32+)
    - `PAYMENT_CALLBACK_TOKEN` (8+ chars)
    - `ADMIN_EMAIL`
    - `CORS_ORIGIN` (your frontend domain, e.g. `https://your-frontend.vercel.app`)
    - `APP_BASE_URL` (your backend public URL, e.g. `https://your-service.onrender.com`)
6. Optional: deploy using `render.yaml` at repository root to auto-configure service settings.

Common Render failure causes:
- Root directory left as repository root (no backend `package.json` found).
- Missing required env vars (`DATABASE_URL`, `JWT_SECRET`, `PAYMENT_CALLBACK_TOKEN`, `ADMIN_EMAIL`).
- Invalid `APP_BASE_URL` (must be a valid URL).

## 3) Frontend Deployment (Vercel)

1. Push `frontend` directory to a Git repository.
2. In Vercel:
   - Framework: Next.js
   - Root directory: `frontend`
   - Environment variable:
    - `NEXT_PUBLIC_API_URL=https://data-hub-6kwj.onrender.com`
3. Deploy.

## 4) Environment Variables

Backend `.env` required keys:
- PORT
- NODE_ENV
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- CORS_ORIGIN (set to your deployed frontend origin, for example `https://your-frontend-domain.com`)
- APP_BASE_URL
- PAYMENT_PROVIDER (SIMULATED | HUBTEL | EXPRESSPAY)
- PAYMENT_CALLBACK_TOKEN
- PAYMENT_CALLBACK_PROVIDER (AUTO | HUBTEL | EXPRESSPAY | TOKEN)
- VTU_PROVIDER (SIMULATED | REAL)
- ADMIN_EMAIL
- Optional provider keys for Hubtel/ExpressPay/VTU:
    - HUBTEL_SIGNING_SECRET
    - EXPRESSPAY_SIGNING_SECRET
    - HUBTEL_CALLBACK_SECRET
    - EXPRESSPAY_CALLBACK_SECRET
    - VTU_API_KEY (required when `VTU_PROVIDER=REAL`)
    - VTU_BASE_URL (required when `VTU_PROVIDER=REAL`)
    - VTU_SIMULATE_FAILURE_SUFFIX (optional, only for simulated VTU failure testing)

### Going Live for Real Data Delivery

For real customer purchases (not simulation):

1. Set `VTU_PROVIDER=REAL` in backend environment.
2. Set `VTU_BASE_URL` to your VTU aggregator API base URL.
3. Set `VTU_API_KEY` to your live provider API key/token.
4. Redeploy backend and run a live sandbox purchase test.
5. Keep wallet refund checks enabled (already built-in) for failed provider responses.

Frontend `.env.local`:
- NEXT_PUBLIC_API_URL (set to your deployed backend URL, for example `https://data-hub-6kwj.onrender.com`)

## 5) Optional Docker Deployment

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- PostgreSQL: localhost:5432

## 6) Operations Checklist

- Use strong JWT secret (32+ chars)
- Restrict CORS to frontend origin
- Set production callback token for payment webhook
- Monitor failed callback logs and refund queue
- Run daily DB backups
- Rotate API credentials periodically

## 7) Automated Tests

Backend:

```bash
cd backend
npm test
```

Frontend (Playwright):

```bash
cd frontend
npx playwright install
npm run test:e2e
```
