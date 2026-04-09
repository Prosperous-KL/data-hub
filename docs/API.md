# Prosperous Data Hub API Documentation

Base URL: `http://localhost:4000`

Authentication header for protected endpoints:

`Authorization: Bearer <jwt_token>`

Idempotency header for funding and bundle purchase:

`x-idempotency-key: <unique-key>`

## Auth Endpoints

### POST /api/auth/register
Request:
```json
{
  "fullName": "Kwame Mensah",
  "email": "kwame@example.com",
  "phone": "233501234567",
  "password": "StrongPass123"
}
```

### POST /api/auth/login
Request:
```json
{
  "email": "kwame@example.com",
  "password": "StrongPass123"
}
```

### GET /api/auth/me
Returns active JWT identity.

## Wallet Endpoints

### GET /api/wallet/balance
Returns wallet available and locked balance.

## Payment Endpoints (MoMo)

### POST /api/payment/initiate
Headers:
- Authorization
- x-idempotency-key

Request:
```json
{
  "amount": 50,
  "momoNumber": "233501234567",
  "provider": "MTN"
}
```

Response:
- pending payment record
- checkout URL or provider reference
- approval message

### POST /api/payment/callback
Provider callback endpoint.

Callback auth:
- Supports provider signature verification with raw-body HMAC:
  - Hubtel: `x-hubtel-signature` or `x-signature`
  - ExpressPay: `x-expresspay-signature` or `x-signature`
- Fallback token mode:
  - `x-callback-token` header must match `PAYMENT_CALLBACK_TOKEN`
  - or request body `signature` field can match token
- Control mode using `PAYMENT_CALLBACK_PROVIDER`:
  - `AUTO` (default): Hubtel or ExpressPay signature accepted, then token fallback
  - `HUBTEL`: only Hubtel signature
  - `EXPRESSPAY`: only ExpressPay signature
  - `TOKEN`: only token-based callback auth

Request:
```json
{
  "externalReference": "PAY-xxxx",
  "status": "SUCCESS",
  "providerReference": "SIM-xxxx",
  "reason": "optional",
  "signature": "callback_secret_token"
}
```

On SUCCESS:
- payment status becomes success
- wallet is credited atomically
- transaction and double-entry ledger rows are written

On FAILED:
- payment marked failed
- no wallet credit

## Provider Signing Details

Outbound payment-initiation requests are signed.

- Hubtel canonical string:
  - `METHOD|PATH|TIMESTAMP|NONCE|JSON_BODY`
  - headers: `X-Client-Id`, `X-Timestamp`, `X-Nonce`, `X-Signature`

- ExpressPay canonical string:
  - `METHOD|PATH|TIMESTAMP|JSON_BODY`
  - headers: `Authorization: Bearer <API_KEY>`, `X-Timestamp`, `X-Signature`

## Data Bundle Endpoints

### GET /api/data/bundles
Returns available bundle catalog grouped by network.

### POST /api/data/buy
Headers:
- Authorization
- x-idempotency-key

Request:
```json
{
  "network": "MTN",
  "bundleCode": "MTN_1GB",
  "phoneNumber": "233501234567"
}
```

Flow:
1. Wallet debit in DB transaction with row lock
2. Data purchase request to VTU provider
3. If provider success: mark delivered
4. If provider fails: automatic wallet refund and mark `failed_refunded`

## Transaction Endpoints

### GET /api/transactions?limit=50
Returns user transaction history.

## Admin Endpoints
All require admin role.

### GET /api/admin/users?limit=100
List users.

### GET /api/admin/transactions?limit=200
List all transactions.

### GET /api/admin/transactions/failed?limit=200
View failed and refund-related transactions.

### POST /api/admin/refund
Request:
```json
{
  "transactionId": "uuid",
  "reason": "Customer escalation case"
}
```

Rules:
- only successful debit transactions can be manually refunded
- duplicate manual refund on same original transaction is blocked

## Health

### GET /health
Service health check.
