# Hubtel SMS Configuration - Quick Start

## Required Credentials

Get from https://portal.hubtel.com → Developers → SMS API

```env
HUBTEL_SMS_CLIENT_ID=your_client_id
HUBTEL_SMS_CLIENT_SECRET=your_client_secret
HUBTEL_SMS_FROM=Prosperous
HUBTEL_SMS_BASE_URL=https://smsc.hubtel.com/v1/messages/send
```

## Supported Phone Formats

The system automatically handles all these formats:

```
0201234567      → +233201234567 ✓
233201234567    → +233201234567 ✓
+233201234567   → +233201234567 ✓
+1201234567     → ✗ Not Ghana format
02012345        → ✗ Too short (< 10 digits)
```

## What's Included

✅ **Auto-generated username** during registration
✅ **Phone number validation** for Ghana format
✅ **Real-time availability checking** for usernames
✅ **SMS error handling** with timeout (15s)
✅ **Gmail fallback** if SMS delivery fails
✅ **Comprehensive logging** for debugging
✅ **Production-ready** implementation

## Environment Setup

### Local Development

```bash
# Create .env file in backend directory
cp .env.example .env

# Add Hubtel credentials
HUBTEL_SMS_CLIENT_ID=your_id
HUBTEL_SMS_CLIENT_SECRET=your_secret
HUBTEL_SMS_FROM=Prosperous
```

### Render Production

1. Go to your Render backend service
2. Environment → Add environment variables
3. Set `HUBTEL_SMS_*` variables
4. Redeploy

## Test SMS Delivery

### Via API

```bash
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "REGISTER",
    "channel": "PHONE",
    "target": "0201234567"
  }'
```

### Via Frontend

1. Register page
2. Enter phone number
3. Choose "Phone" for OTP
4. SMS arrives in seconds

## Monitoring

Check logs for success indicators:

```
✓ [otpDelivery] Hubtel SMS sent successfully
✗ [otpDelivery] Hubtel SMS failed - check Hubtel credits
✗ [otpDelivery] Hubtel SMS error - check credentials/network
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SMS not received | Check Hubtel SMS credits balance |
| Invalid credentials error | Verify `HUBTEL_SMS_*` env vars |
| Timeout error | Check network to Hubtel API |
| Sender ID rejected | Verify sender ID approved in Hubtel portal |

## Detailed Setup Guide

Full setup instructions: [HUBTEL_SMS_SETUP.md](./HUBTEL_SMS_SETUP.md)
