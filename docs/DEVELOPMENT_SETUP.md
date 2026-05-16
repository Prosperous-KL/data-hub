# Development Setup Guide

Quick start for developers working on this project.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 12+ (local or remote)
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd "Data Hub"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Setup Environment

```bash
# Copy backend environment template
cp backend/.env.example backend/.env

# Copy frontend environment template
cp frontend/.env.local.example frontend/.env.local
```

**⚠️ Important**: Edit `.env` files with your local values:
- PostgreSQL connection string (or use the provided template database URL)
- JWT_SECRET (can use any string for development)
- API URL for frontend

### 3. Database Setup

```bash
# Create and setup database schema
cd backend
npm run db:setup
cd ..
```

### 4. Start Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend running at http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:3000
```

Visit **http://localhost:3000** to see the app.

## Common Development Tasks

### Run Tests

**Backend:**
```bash
cd backend
npm test              # Run all tests once
npm run test:watch   # Watch mode
```

**Frontend (E2E):**
```bash
cd frontend
npx playwright install  # First time setup
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with UI
```

### Database

```bash
# Setup/reset database
cd backend
npm run db:setup

# View schema
psql -U postgres -d prosperous_data_hub -f database/schema.sql
```

### Environment Variables

**Backend (`backend/.env`):**
- `NODE_ENV=development` - Development mode
- `PORT=4000` - Backend port
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Any string for dev (use strong secret in production)
- `CORS_ORIGIN=http://localhost:3000` - Frontend URL
- `PAYMENT_PROVIDER=SIMULATED` - Use simulated payments in dev
- `VTU_PROVIDER=SIMULATED` - Use simulated VTU in dev

**Frontend (`frontend/.env.local`):**
- `NEXT_PUBLIC_API_URL=http://localhost:4000` - Backend URL
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` - Site URL

### Adding Credentials (Development Only)

For testing payment integrations in development:

```bash
# Edit backend/.env and add provider credentials
PAYMENT_PROVIDER=HUBTEL
HUBTEL_CLIENT_ID=your_test_id
HUBTEL_CLIENT_SECRET=your_test_secret

# Or for SMS testing
HUBTEL_SMS_CLIENT_ID=your_sms_id
HUBTEL_SMS_CLIENT_SECRET=your_sms_secret
HUBTEL_SMS_FROM=YourBrand
```

## Project Structure

```
backend/
  src/
    config/          # Environment & configuration
    db/              # Database connection & utilities
    middleware/      # Express middleware
    modules/         # Feature modules (auth, payment, etc)
    utils/           # Utility functions
  tests/             # Test files
  
frontend/
  app/               # Next.js pages & layouts
  components/        # Reusable React components
  lib/               # Utility functions
  public/            # Static assets

database/
  schema.sql         # Database schema

docs/
  API.md             # API documentation
  DEPLOYMENT.md      # Production deployment guide
  PRODUCTION_READY.md # Production readiness guide
```

## API Testing

### Using cURL

```bash
# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123@","phone":"+233501234567"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123@"}'
```

### Using Postman

Import the API collection from [API.md](./docs/API.md) documentation.

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Verify PostgreSQL is running and DATABASE_URL is correct.

```bash
# Test connection
psql -c "select version();"
```

### Port Already in Use
```
Error: listen EADDRINUSE :::4000
```
**Solution**: Change PORT in `.env` or kill the process using the port.

```bash
# Windows
netstat -ano | findstr :4000

# macOS/Linux
lsof -i :4000
```

### Module Not Found
```
Error: Cannot find module
```
**Solution**: Reinstall dependencies.

```bash
rm -rf node_modules package-lock.json
npm install
```

## Code Style

The project uses:
- **Backend**: JavaScript (Node.js + Express)
- **Frontend**: React + Next.js
- **Formatting**: Follow existing code style
- **Linting**: Run tests before committing

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

**Important**: Never commit `.env` files. Only `.env.example` should be in git.

## IDE Setup

### VS Code (Recommended)

**Recommended Extensions:**
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- PostCSS Language Support
- Thunder Client (API testing)

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Production Deployment

Before deploying to production, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Step-by-step deployment guide
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [PRODUCTION_READY.md](./PRODUCTION_READY.md) - Production readiness summary

## Common Issues & Solutions

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if available, or check the issues section of this repository.

## Getting Help

1. Check the [API.md](./API.md) documentation
2. Review error logs: `npm run dev` shows detailed errors
3. Check test files for usage examples
4. Review GitHub issues and discussions

## Next Steps

1. ✅ Set up local environment
2. ✅ Run tests to verify setup
3. ✅ Read API.md for endpoint documentation
4. ✅ Start with a small feature or bug fix
5. ✅ Create a pull request when ready
