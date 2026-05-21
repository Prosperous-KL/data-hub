# Security checklist

Follow these steps before deploying to production:

- Use a secure secret for `JWT_SECRET` (minimum 32 characters).
- Store all secrets in the hosting platform's secret manager (Railway / Render), not in the repo.
- Ensure `DATABASE_URL` uses SSL (Neon requires sslmode=require).
- Limit CORS to production frontend origins via `CORS_ORIGIN`.
- Rotate `PAYMENT_CALLBACK_TOKEN` and webhook secrets periodically.
- Configure HTTPS and HSTS on the frontend and backend hosting layers.
- Enable automatic dependency updates and run `npm audit` regularly.
- Remove debug endpoints and ensure `NODE_ENV=production` on prod.

Recommended runtime protections:

- Use a Web Application Firewall (WAF) when exposing the backend to the internet.
- Configure rate limiting (already present) and monitoring/alerts on errors.
- Use managed DB with automated backups (Neon provides this).
