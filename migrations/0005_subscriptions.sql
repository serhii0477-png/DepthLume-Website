-- Subscription data is stored server-side; payment-card data never enters D1.
ALTER TABLE licenses ADD COLUMN access_type TEXT NOT NULL DEFAULT 'subscription' CHECK (access_type IN ('trial','subscription','complimentary'));
ALTER TABLE licenses ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'active' CHECK (billing_status IN ('trialing','active','past_due','cancelled'));
ALTER TABLE licenses ADD COLUMN cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0,1));
ALTER TABLE licenses ADD COLUMN provider_subscription_id TEXT;
ALTER TABLE licenses ADD COLUMN trial_used_at TEXT;

CREATE UNIQUE INDEX idx_licenses_provider_subscription ON licenses(provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX idx_licenses_billing ON licenses(product, billing_status, expires_at);

CREATE TABLE payment_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  provider_subscription_id TEXT,
  license_id TEXT REFERENCES licenses(id),
  user_id TEXT REFERENCES users(id),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount INTEGER,
  currency TEXT,
  received_at TEXT NOT NULL,
  UNIQUE(provider, provider_payment_id, event_type)
);

CREATE INDEX idx_payment_events_license ON payment_events(license_id, received_at DESC);
