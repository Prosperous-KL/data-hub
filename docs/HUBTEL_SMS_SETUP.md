# Hubtel SMS Verification Setup Guide

## Overview

This guide explains how to configure Hubtel SMS verification for OTP delivery in the Prosperous Data Hub application.

## Prerequisites

1. **Hubtel Account**: Create an account at https://www.hubtel.com
2. **Business Verification**: Complete your business profile verification
3. **SMS Credits**: Ensure you have SMS credits in your account
4. **API Credentials**: Have your Hubtel SMS API credentials ready

## Step 1: Get Hubtel SMS Credentials

### 1.1 Access Hubtel Portal

1. Go to https://portal.hubtel.com
2. Log in with your Hubtel account credentials
3. Navigate to **Developers** → **SMS API**

### 1.2 Generate API Credentials

1. Click **Create New SMS Sender**
2. Fill in the sender name (e.g., "Prosperous")
   - This name will appear as the sender ID in SMS messages
   - Ghana regulators typically accept 11 characters or less
3. Click **Generate Credentials**
4. Note your credentials:
   - **Client ID** (HUBTEL_SMS_CLIENT_ID)
   - **Client Secret** (HUBTEL_SMS_CLIENT_SECRET)
   - **Sender Name** (HUBTEL_SMS_FROM)

### 1.3 Verify SMS Sender ID

1. Hubtel may require verification of your sender name
2. Upload business documents if prompted
3. Wait for approval (usually 24-48 hours)
4. You'll receive confirmation email when approved

## Step 2: Environment Configuration

### 2.1 Update .env File

In your backend `.env` file, add the Hubtel SMS credentials:

```env
# SMS Configuration (Hubtel for OTP delivery)
HUBTEL_SMS_BASE_URL=https://smsc.hubtel.com/v1/messages/send
HUBTEL_SMS_CLIENT_ID=your_actual_client_id
HUBTEL_SMS_CLIENT_SECRET=your_actual_client_secret
HUBTEL_SMS_FROM=Prosperous
```

### 2.2 Configuration Values Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `HUBTEL_SMS_BASE_URL` | Hubtel SMS API endpoint | `https://smsc.hubtel.com/v1/messages/send` |
| `HUBTEL_SMS_CLIENT_ID` | Your API Client ID from Hubtel | `ABC123XYZ789` |
| `HUBTEL_SMS_CLIENT_SECRET` | Your API Client Secret (keep secure!) | `secret_key_abc123xyz789` |
| `HUBTEL_SMS_FROM` | Sender ID (appears in SMS) | `Prosperous` |

### 2.3 Email Configuration (Optional but Recommended)

For fallback email delivery, also configure Gmail:

```env
SMTP_GMAIL_USER=your-email@gmail.com
SMTP_GMAIL_APP_PASSWORD=your_app_specific_password
SMTP_FROM_NAME=Prosperous Data Hub
```

## Step 3: Verify Installation

### 3.1 Check Dependencies

Ensure required packages are installed:

```bash
cd backend
npm ls axios nodemailer
```

Required packages:
- `axios` - For HTTP requests to Hubtel API
- `nodemailer` - For Gmail fallback

### 3.2 Test Configuration

Create a test script to verify Hubtel connection:

```bash
# From backend directory
node -e "
require('dotenv').config();
const env = require('./src/config/env');
console.log('Configuration Check:');
console.log('✓ Base URL:', env.HUBTEL_SMS_BASE_URL);
console.log('✓ Client ID configured:', !!env.HUBTEL_SMS_CLIENT_ID);
console.log('✓ Client Secret configured:', !!env.HUBTEL_SMS_CLIENT_SECRET);
console.log('✓ Sender Name:', env.HUBTEL_SMS_FROM);
"
```

## Step 4: OTP Delivery Configuration

The application automatically routes OTP requests based on channel:

### 4.1 SMS (Phone) Channel

When user requests OTP on their **phone number**:
1. System validates Ghana phone number format
2. Normalizes to international format (+233...)
3. Sends via Hubtel API
4. Fallback to Gmail if SMS fails

### 4.2 Email Channel

When user requests OTP on their **email**:
1. Sends via Gmail SMTP
2. Hubtel is not used for email

### 4.3 Phone Number Formats

The system accepts multiple Ghana phone formats:

```
✓ +233201234567
✓ 233201234567
✓ 0201234567
✗ 02012345 (too short)
✗ +1201234567 (wrong country)
```

## Step 5: Monitor and Debug

### 5.1 Check Application Logs

Monitor OTP delivery in application logs:

```bash
# Look for SMS delivery logs
grep -i "hubtel\|SMS\|OTP" logs/app.log
```

Log messages indicate:
- ✓ `[otpDelivery] Hubtel SMS sent successfully` - Success
- ✗ `[otpDelivery] Hubtel SMS failed` - Failed with details
- ✗ `[otpDelivery] Hubtel SMS error` - Network/config error

### 5.2 Hubtel SMS Status

Monitor Hubtel account for delivery status:

1. Go to https://portal.hubtel.com
2. Navigate to **SMS** → **Inbox** or **Reports**
3. View delivery status for each message
4. Check credits balance

### 5.3 Common Issues

#### Issue: "SMS_DELIVERY_NOT_CONFIGURED"

**Cause**: Missing Hubtel credentials

**Solution**:
```bash
# Verify environment variables are set
echo $HUBTEL_SMS_CLIENT_ID
echo $HUBTEL_SMS_CLIENT_SECRET
echo $HUBTEL_SMS_FROM
```

#### Issue: SMS not reaching recipient

**Causes**:
- Hubtel SMS credits depleted
- Phone number not Ghana format
- Sender ID not approved
- Network issues

**Solutions**:
1. Check SMS credits in Hubtel portal
2. Verify phone number format: must start with 0, 233, or +233
3. Confirm sender ID is approved in Hubtel portal
4. Check network connectivity to Hubtel API
5. Review error message in logs for details

#### Issue: Network timeout sending SMS

**Cause**: Hubtel API unresponsive

**Solution**:
- Timeout is set to 15 seconds
- Check Hubtel status: https://status.hubtel.com
- Verify your IP isn't blocked by Hubtel (firewall/VPN)

## Step 6: Production Deployment

### 6.1 Render Deployment

When deploying to Render:

1. Go to your Render dashboard
2. Select your backend service
3. Navigate to **Environment**
4. Add environment variables:
   - `HUBTEL_SMS_CLIENT_ID`
   - `HUBTEL_SMS_CLIENT_SECRET`
   - `HUBTEL_SMS_FROM`
   - `HUBTEL_SMS_BASE_URL`
5. Redeploy the service

```bash
# Verify variables on Render
echo "Checking env vars..."
env | grep HUBTEL_SMS
```

### 6.2 Sender ID Best Practices

For Ghana market:

1. **Company Name**: Use your business name (11 chars max)
   - ✓ "Prosperous" (9 chars)
   - ✓ "DataHub" (7 chars)
   - ✗ "Prosperous Data Hub" (too long)

2. **Brand Recognition**: Use name customers recognize
   - Helps SMS avoid spam filters
   - Increases message delivery rates

3. **Regulatory Compliance**: Check Ghana regulations
   - NCA (National Communications Authority) guidelines
   - May require business registration
   - Keep records of approval

## Step 7: Testing

### 7.1 End-to-End Test

1. Start backend server
2. Open frontend application
3. Go to **Register** or **Login**
4. Choose **Phone** for OTP
5. Enter your test number (Ghana format)
6. Wait for SMS

### 7.2 Manual Test via API

```bash
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "REGISTER",
    "channel": "PHONE",
    "target": "+233201234567"
  }'
```

Expected response:
```json
{
  "success": true,
  "otpSessionId": "uuid-here",
  "maskedTarget": "****1234"
}
```

Check your phone for SMS within seconds.

## Step 8: Fallback Strategy

The application has a built-in fallback system:

1. **Primary**: Hubtel SMS (for phone channel)
2. **Fallback**: Gmail (if SMS fails)
3. **Error**: Return error to user to retry

Log entries show which method was used:

```
[otpDelivery] Hubtel SMS sent successfully
-- OR --
[otpDelivery] Hubtel SMS error → falling back to Gmail
-- OR --
[otpDelivery] Both SMS and email failed
```

## Troubleshooting Checklist

- [ ] Hubtel SMS credentials are correct
- [ ] `HUBTEL_SMS_FROM` is approved in Hubtel portal
- [ ] SMS credits available in Hubtel account
- [ ] Phone number in Ghana format (0XX, 233XX, +233XX)
- [ ] Backend environment variables set correctly
- [ ] Gmail credentials configured (for fallback)
- [ ] Network connectivity to Hubtel API available
- [ ] Application logs show no errors
- [ ] Test SMS received on phone

## Support Resources

- **Hubtel Documentation**: https://docs.hubtel.com
- **API Postman Collection**: https://www.postman.com/hubtel
- **Status Page**: https://status.hubtel.com
- **Support Email**: support@hubtel.com

## Additional Configuration

### Adjust SMS Timeout

Edit `backend/src/modules/auth/otpDelivery.js`:

```javascript
// Change timeout from 15000ms to your preferred value
timeout: 15000, // milliseconds
```

### Custom SMS Message

Edit `backend/src/modules/auth/otpDelivery.js`:

```javascript
function buildConfirmationText(code, purpose) {
  return `Your Prosperous verification code is ${code}. Valid for 10 minutes.`;
}
```

### Enable Production Logging

Set in `.env`:
```env
NODE_ENV=production
LOG_LEVEL=info
```

## Next Steps

1. ✅ Get Hubtel SMS credentials
2. ✅ Configure environment variables
3. ✅ Test SMS delivery
4. ✅ Deploy to production
5. ✅ Monitor and maintain

For any issues, check the logs and refer to this guide's troubleshooting section.
