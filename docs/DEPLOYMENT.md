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

## 3) Frontend Deployment (Vercel)

1. Push `frontend` directory to a Git repository.
2. In Vercel:
   - Framework: Next.js
   - Root directory: `frontend`
   - Environment variable:
     - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
3. Deploy.

## 4) Environment Variables

Backend `.env` required keys:
- PORT
- NODE_ENV
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- CORS_ORIGIN
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

Frontend `.env.local`:
- NEXT_PUBLIC_API_URL

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
