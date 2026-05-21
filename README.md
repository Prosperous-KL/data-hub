# Prosperous Data Hub

**Production-ready fintech platform** for Ghana internet data bundles (VTU), featuring secure authentication, wallet management, Mobile Money integration, and admin controls.

## 📋 Quick Links

- **🚀 [Production Deployment](docs/DEPLOYMENT.md)** - Step-by-step deployment guide
- **⚙️ [Development Setup](docs/DEVELOPMENT_SETUP.md)** - Local development environment
- **📝 [API Documentation](docs/API.md)** - Complete API reference
- **✅ [Production Checklist](docs/PRODUCTION_CHECKLIST.md)** - Pre-deployment verification
- **🔒 [Production Ready](docs/PRODUCTION_READY.md)** - Production hardening summary

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 16.2.x + React 19 + Tailwind CSS |
| **Backend** | Node.js + Express (modular architecture) |
| **Database** | PostgreSQL with connection pooling |
| **Authentication** | JWT + bcrypt |
| **Payments** | Hubtel, Paystack, ExpressPay (pluggable) |
| **Hosting** | Railway backend + Render frontend + Neon Postgres |

## ✨ Core Features

- ✅ Secure JWT authentication with token refresh
- ✅ User wallet accounts with transaction history
- ✅ Double-entry ledger for financial accuracy
- ✅ Mobile Money wallet funding
- ✅ Buy data bundles (MTN, Telecel, AirtelTigo)
- ✅ Automatic refunds on delivery failure
- ✅ Admin dashboard & user management
- ✅ Idempotency protection for payments
- ✅ Rate limiting & security headers
- ✅ Input validation with Zod schemas

## 📁 Project Structure

```
backend/src/           # Express backend
  ├── config/          # Environment & config
  ├── db/              # Database utilities
  ├── middleware/      # Auth, validation, errors
  ├── modules/         # Feature modules
  │   ├── auth/        # Registration, login, OTP
  │   ├── payment/     # Payment processing
  │   ├── vtu/         # Data bundle purchases
  │   ├── wallet/      # Wallet operations
  │   ├── transaction/ # Transaction history
  │   └── admin/       # Admin operations
  └── utils/           # Utility functions

frontend/              # Next.js frontend
  ├── app/             # Pages & layouts
  ├── components/      # React components
  └── lib/             # API & utilities

docs/                  # Documentation
database/              # SQL schema
```

## 🚀 Getting Started

### For Development

```bash
# Install and setup
cd backend && npm install && npm run db:setup
cd ../frontend && npm install
cd ..

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Start services (in separate terminals)
cd backend && npm run dev    # http://localhost:4000
cd frontend && npm run dev   # http://localhost:3000
```

**→ See [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for detailed setup**

### For Production

Follow the [DEPLOYMENT.md](docs/DEPLOYMENT.md) guide for step-by-step production deployment.

**Before deploying, complete the [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)**.

## 🔐 Security & Fintech Features

- **Double-entry ledger** - All wallet transactions recorded with before/after balances
- **Transaction isolation** - Database transactions prevent race conditions
- **Row-level locking** - Wallet updates use `SELECT FOR UPDATE` to prevent double-spending
- **Idempotency protection** - Payment operations are idempotent (safe to retry)
- **Callback verification** - Payment webhooks verified with HMAC signatures
- **Automatic refunds** - Failed deliveries trigger automatic wallet credits
- **Audit trail** - All financial events logged with metadata
- **JWT tokens** - Secure stateless authentication
- **Rate limiting** - 100 requests/minute per IP to prevent abuse
- **Input validation** - All inputs validated with Zod schemas

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) | Local development environment setup |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment instructions |
| [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Pre-deployment verification |
| [PRODUCTION_READY.md](docs/PRODUCTION_READY.md) | Production hardening summary |
| [API.md](docs/API.md) | Complete API endpoint reference |
| [HUBTEL_SMS_SETUP.md](docs/HUBTEL_SMS_SETUP.md) | SMS gateway configuration |
| [SMS_QUICK_START.md](docs/SMS_QUICK_START.md) | SMS setup quick reference |

## 🧪 Testing

**Backend tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch   # Watch mode
```

**Frontend E2E tests:**
```bash
cd frontend
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run with UI
```

## 📱 Testing Payment Callbacks

To test payment callback handling:

```bash
curl -X POST http://localhost:4000/api/payment/callback \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your_callback_token" \
  -d '{
    "externalReference": "REF-123",
    "status": "SUCCESS",
    "providerReference": "PROV-456"
  }'
```

## ⚠️ Known Issues

- Next.js 16.2.x has an upstream PostCSS advisory in its bundled dependencies
- This advisory is external to the application code and does not affect functionality
- Application has been tested and verified working despite this advisory

## 🚢 Deployment Options

### Recommended: Neon + Railway + Render
- Neon for managed PostgreSQL
- Railway for the backend API
- Render for the Next.js frontend
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md#neon-railway-render-stack)

### Traditional: VPS with PM2 + Nginx
- Full control over infrastructure
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md#2-backend-deployment-nodejs--pm2--nginx)

### Frontend: Render
- Optimized for Next.js web services
- Automatic HTTPS and deploys from GitHub
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md#3-frontend-deployment-render)

### Docker Compose
```bash
docker compose up --build
```

## 📋 Environment Variables

All environment variables are documented in:
- `backend/.env.example` - Backend configuration
- `frontend/.env.local.example` - Frontend configuration

**⚠️ Never commit `.env` files** - Use `.env.example` templates only

## 🔗 API Endpoints

See [API.md](docs/API.md) for complete endpoint documentation including:
- Authentication (register, login, logout)
- Wallet operations
- Payment initiation and callbacks
- Data bundle purchases
- Admin operations
- Transaction history

## 🤝 Contributing

1. Read [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)
2. Create a feature branch
3. Write tests for new features
4. Ensure tests pass: `npm test` (backend) or `npm run test:e2e` (frontend)
5. Submit a pull request

## 📞 Support

For deployment or configuration issues, see:
1. [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Setup instructions
2. [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) - Verification items
3. [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) - Troubleshooting section

## 📄 License

[Add your license here]

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
