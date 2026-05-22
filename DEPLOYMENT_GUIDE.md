# Complete Deployment Guide

Deploy Data Hub with this stack:

- Database: Neon PostgreSQL
- Backend: Railway
- Frontend: Render

## Neon

1. Create a Neon project.
2. Copy the connection string and keep `sslmode=require`.
3. Apply `backend/database/schema.sql`.

## Railway backend

1. Create a Railway project from this repository.
2. Set the root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Set `DATABASE_URL`, `JWT_SECRET`, `PAYMENT_CALLBACK_TOKEN`, `CORS_ORIGIN`, and `APP_BASE_URL`.

## Render frontend

1. Create a Render Web Service from this repository.
2. Set the root directory to `frontend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set `NEXT_PUBLIC_API_URL` to the Railway backend URL.

## Notes

- Update `CORS_ORIGIN` after the Render URL is known.
- Confirm `/health` works on Railway before pointing the frontend at it.

For a concise checklist, see [DEPLOYMENT_QUICK_CARD.md](DEPLOYMENT_QUICK_CARD.md).
