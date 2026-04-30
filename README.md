# Prosperous Data Hub

Production-ready fintech web platform for Ghana internet data bundles (VTU), including wallet funding through Mobile Money, secure auth, instant data delivery, and admin refund controls.

## Stack

- Frontend: Next.js 16.2.x + Tailwind CSS
- Backend: Node.js + Express (modular service architecture)
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Payments: Hubtel/ExpressPay-ready adapter with simulated mode
- Signed payment requests + callback signature verification
- Hosting: PM2 + Nginx + Vercel, Docker optional

## Core Features

- Secure register/login with JWT
- Wallet account per user
- Double-entry ledger and transaction history
- MoMo wallet funding (`/api/payment/initiate`, `/api/payment/callback`)
- Buy data bundles for MTN, Telecel, AirtelTigo
- Automatic refund if VTU delivery fails
- Admin dashboard for users, failed transactions, manual refunds
- Idempotency protection for money-changing actions
- Rate limiting + security headers + input validation

## Project Structure

```text
backend/
  src/
    config/
    db/
    middleware/
    modules/
      auth/
      wallet/
      transaction/
      payment/
      vtu/
      admin/
frontend/
  app/
    (auth)/
    dashboard/
    buy-data/
    wallet-funding/
    transactions/
    admin/
database/
  schema.sql
docs/
  API.md
  DEPLOYMENT.md
```

## Local Run

## 1) Database

```bash
createdb prosperous_data_hub
psql -U postgres -d prosperous_data_hub -f database/schema.sql
```

## 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Update `backend/.env` with your DB URL and secrets.

### Configure Hubtel SMS (Optional but Recommended)

For OTP delivery via SMS during registration/auth:

```bash
# Edit backend/.env and add:
HUBTEL_SMS_CLIENT_ID=your_client_id
HUBTEL_SMS_CLIENT_SECRET=your_client_secret
HUBTEL_SMS_FROM=YourBrand
```

**[📖 Full SMS Setup Guide](docs/HUBTEL_SMS_SETUP.md)** | **[⚡ Quick Start](docs/SMS_QUICK_START.md)**

Then verify configuration:

```bash
node backend/scripts/verify-hubtel-config.js
```

## 3) Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend URL: http://localhost:3000
Backend URL: http://localhost:4000

## Simulate Payment Callback

After funding is initiated, use the returned `external_reference`:

```bash
curl -X POST http://localhost:4000/api/payment/callback \
  -H "Content-Type: application/json" \
  -H "x-callback-token: callback_secret_token" \
  -d '{
    "externalReference": "PAY-REPLACE-ME",
    "status": "SUCCESS",
    "providerReference": "SIM-123"
  }'
```

## Security and Fintech Notes

- Wallet debit/credit operations run inside DB transactions
- Wallet row lock (`FOR UPDATE`) prevents race conditions and double spending
- Idempotency key required for payment initiate and data purchase
- Automatic refund writes independent credit transaction with audit metadata
- Ledger keeps before/after wallet balances for each financial event
- In simulated VTU mode, `VTU_SIMULATE_FAILURE_SUFFIX` can be set to force failures for matching recipient numbers during testing

### Known Frontend Advisory

The frontend is intentionally kept on the stable Next.js 16.2.x line because it passes build and E2E validation.
`npm audit` still reports a moderate upstream PostCSS advisory through Next's bundled dependency tree, but the app remains functional and the issue is outside the project code itself.

## Automated Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npx playwright install
npm run test:e2e
```

## Deployment

See:
- docs/DEPLOYMENT.md
- docs/API.md
