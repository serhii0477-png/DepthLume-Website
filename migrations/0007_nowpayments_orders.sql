CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  license_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider ON payment_orders(provider, id);
