Railway deployment guide — Backend (Node) with Neon Postgres

1. Create a Railway project and connect your GitHub repository (or deploy from local via CLI).

2. Set the build/deploy settings to use the `backend` folder. Railway will detect `Dockerfile` or use `npm install && npm start`.

3. Create a Neon Postgres database and copy the `DATABASE_URL` value.

4. In Railway project settings -> Variables, add these environment variables (use secure values):
   - `NODE_ENV` = `production`
   - `PORT` = `4000`
   - `DATABASE_URL` = <your neon DATABASE_URL>
   - `JWT_SECRET` = <strong secret, min 32 chars>
   - `PAYMENT_PROVIDER` = `PAYSTACK`
   - `PAYSTACK_SECRET_KEY` = <your paystack secret key>
   - `PAYSTACK_WEBHOOK_SECRET` = <your paystack webhook secret>
   - `PAYMENT_CALLBACK_PROVIDER` = `PAYSTACK`
   - `PAYMENT_CALLBACK_TOKEN` = <fallback callback token (optional)>
   - `HUBTEL_SMS_CLIENT_ID`, `HUBTEL_SMS_CLIENT_SECRET`, `HUBTEL_SMS_FROM` = <Hubtel SMS creds>
   - `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, `HUBTEL_SIGNING_SECRET`, `HUBTEL_BASE_URL` = <Hubtel payment creds>
   - `APP_BASE_URL` = `https://<your-backend-host>`
   - `CORS_ORIGIN` = `https://<your-frontend-host>`

5. Set the Railway health check to `/health` and deploy. The app logs will show validation of environment variables.

6. Paystack webhook: in Paystack dashboard, set the webhook URL to `https://<your-backend-host>/api/payment/callback` and copy the `PAYSTACK_WEBHOOK_SECRET` into Railway.

7. Neon connection: ensure the `DATABASE_URL` includes `sslmode=require` if required by Neon.

8. Run DB migrations locally or on Railway via `node dbSetup.js` or the `db:setup` script:

```bash
cd backend
npm ci
npm run db:setup
```

9. Test end-to-end: create a test user, initiate a Paystack payment via `/api/payment/initiate`, then simulate the webhook from Paystack to confirm wallet funding.

Notes:
- Hubtel SMS OTP is already implemented in `src/modules/auth/otpDelivery.js`. It uses `HUBTEL_SMS_*` env vars for SMS and `HUBTEL_*` for payment signatures.
- Paystack integration is implemented in `src/modules/payment/payment.provider.js` and callback verification is handled by `src/modules/payment/payment.routes.js` using HMAC verification.
