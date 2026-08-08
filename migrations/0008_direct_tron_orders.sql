ALTER TABLE payment_orders ADD COLUMN expected_amount_raw INTEGER;
ALTER TABLE payment_orders ADD COLUMN expires_at TEXT;
ALTER TABLE payment_orders ADD COLUMN payment_txid TEXT;
CREATE INDEX IF NOT EXISTS idx_payment_orders_tron_amount ON payment_orders(provider, expected_amount_raw, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_payment ON payment_events(provider, provider_payment_id);
