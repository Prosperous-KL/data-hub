BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(25) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  locked_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(128) PRIMARY KEY,
  response_status INT NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY,
  purpose VARCHAR(32) NOT NULL,
  channel VARCHAR(16) NOT NULL,
  target VARCHAR(255) NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('debit', 'credit')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'reversed')),
  reference VARCHAR(120) NOT NULL UNIQUE,
  narration VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  idempotency_key VARCHAR(128) UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(14, 2) NOT NULL CHECK (balance_before >= 0),
  balance_after NUMERIC(14, 2) NOT NULL CHECK (balance_after >= 0),
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('MTN', 'TELECEL', 'AIRTELTIGO')),
  momo_number VARCHAR(25) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  external_reference VARCHAR(120) NOT NULL UNIQUE,
  provider_reference VARCHAR(120),
  idempotency_key VARCHAR(128) UNIQUE,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  network VARCHAR(20) NOT NULL CHECK (network IN ('MTN', 'TELECEL', 'AIRTELTIGO')),
  bundle_code VARCHAR(50) NOT NULL,
  volume VARCHAR(20) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  phone_number VARCHAR(25) NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'delivered', 'failed_refunded')),
  provider_reference VARCHAR(120),
  failure_reason VARCHAR(255),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
ON transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction
ON ledger(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
ON payments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_purchases_user_created
ON data_purchases(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_purchases_status
ON data_purchases(status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_wallets_set_updated_at ON wallets;
CREATE TRIGGER trg_wallets_set_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_set_updated_at ON transactions;
CREATE TRIGGER trg_transactions_set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_set_updated_at ON payments;
CREATE TRIGGER trg_payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_data_purchases_set_updated_at ON data_purchases;
CREATE TRIGGER trg_data_purchases_set_updated_at
BEFORE UPDATE ON data_purchases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'otp_codes_attempts_non_negative'
  ) THEN
    ALTER TABLE otp_codes
    ADD CONSTRAINT otp_codes_attempts_non_negative CHECK (attempts >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'otp_codes_expires_after_created'
  ) THEN
    ALTER TABLE otp_codes
    ADD CONSTRAINT otp_codes_expires_after_created CHECK (expires_at >= created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallets_total_balance_non_negative'
  ) THEN
    ALTER TABLE wallets
    ADD CONSTRAINT wallets_total_balance_non_negative CHECK ((available_balance + locked_balance) >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'idempotency_response_status_range'
  ) THEN
    ALTER TABLE idempotency_keys
    ADD CONSTRAINT idempotency_response_status_range CHECK (response_status BETWEEN 100 AND 599);
  END IF;
END $$;

COMMIT;
