# Production Deployment Checklist

Before deploying to production, ensure the following:

## Environment Configuration
- [ ] **DATABASE_URL**: Set to production PostgreSQL database (never localhost)
- [ ] **JWT_SECRET**: Generated a strong, random secret (min 32 characters)
- [ ] **NODE_ENV**: Set to `production`
- [ ] **PAYMENT_CALLBACK_TOKEN**: Changed from default placeholder
- [ ] **All API keys/secrets**: Updated with real production credentials
- [ ] `.env` file: NOT committed to git (should be gitignored)
- [ ] `.env.example`: Committed with safe placeholder values

## Security Configuration
- [ ] **CORS_ORIGIN**: Restricted to your frontend domain(s) only (never `*`)
- [ ] **HTTPS_ONLY**: Ensure all external URLs use HTTPS
- [ ] **HELMET.js**: Security headers enabled (already configured)
- [ ] **Rate Limiting**: Enabled and appropriate limits set
- [ ] **JWT_EXPIRES_IN**: Set to appropriate duration (e.g., 7d)
- [ ] **Password Hashing**: Using bcrypt with appropriate salt rounds

## Payment Integration
- [ ] **Payment Provider**: Set appropriate provider (HUBTEL, PAYSTACK, MTN, etc.)
- [ ] **Payment Credentials**: All credentials for payment provider configured
- [ ] **Callback URLs**: Webhook URLs configured in payment provider dashboard
- [ ] **Callback Signatures**: Signing secrets configured and validated

## Email & SMS Configuration
- [ ] **SMTP Settings**: Gmail app password configured (or alternative SMTP)
- [ ] **SMS Provider**: Hubtel/Twilio configured with production credentials
- [ ] **From Address**: Sender address properly configured

## Database
- [ ] **Schema**: Run `npm run db:setup` in production environment first
- [ ] **Backups**: Automated backup strategy in place
- [ ] **SSL/TLS**: Database connection uses SSL in production

## Monitoring & Logging
- [ ] **Application Logging**: Configure logging service (e.g., Sentry, LogRocket)
- [ ] **Error Tracking**: Error reporting configured
- [ ] **Performance Monitoring**: APM configured (e.g., New Relic, DataDog)
- [ ] **Health Checks**: `/health` endpoint tested and monitoring

## Frontend Configuration
- [ ] **NEXT_PUBLIC_API_URL**: Points to production backend
- [ ] **NEXT_PUBLIC_SITE_URL**: Set to production domain
- [ ] **Next.js Build**: Run production build locally first
- [ ] **Environment Files**: `.env.local` properly set (not committed)

## Docker (if using containers)
- [ ] **Docker Images**: Built from clean state
- [ ] **Secrets**: Not baked into images (use environment variables)
- [ ] **Port Mappings**: Correct ports exposed
- [ ] **Health Checks**: Container health checks configured

## Deployment
- [ ] **Dependencies**: All production dependencies listed (no dev dependencies in production)
- [ ] **Build Process**: Tested and documented
- [ ] **Startup Script**: Correct entry point configured
- [ ] **Port Configuration**: Uses environment variable `PORT` (not hardcoded)

## Post-Deployment
- [ ] **Test APIs**: Verify all endpoints work
- [ ] **Test Payment Flow**: Complete test transaction (use simulated mode first if available)
- [ ] **User Authentication**: Test registration, login, token refresh
- [ ] **Health Endpoint**: Verify `/health` returns success
- [ ] **Error Handling**: Verify errors don't expose sensitive information

## Secrets Management
- [ ] **Secrets Service**: Using proper secrets management (Render secrets, AWS Secrets Manager, etc.)
- [ ] **No Hardcoded Secrets**: Verified no hardcoded credentials in code
- [ ] **Rotation Schedule**: Plan for regular credential rotation
- [ ] **Audit Trail**: Access to secrets is logged

## Performance
- [ ] **Database Connection Pool**: Configured for production load
- [ ] **Cache Strategy**: Configured if applicable
- [ ] **CDN**: Frontend assets served via CDN if applicable
- [ ] **Compression**: Gzip enabled for API responses

## Documentation
- [ ] **Deployment Guide**: Updated with production deployment steps
- [ ] **Environment Variables**: Documented all required variables
- [ ] **Runbooks**: Created runbooks for common issues
- [ ] **API Documentation**: Current and accurate

---

## Critical: Before Going Live
**DO NOT proceed to production without completing ALL checks above.**

If any check cannot be completed, document why and get approval from the team lead.
