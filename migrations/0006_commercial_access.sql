-- Keeps the former beta allowlist intact while allowing only a verified user
-- who has started the commercial trial to use a paid Radar license.
ALTER TABLE users ADD COLUMN commercial_enabled_at TEXT;
CREATE INDEX idx_users_commercial_access ON users(commercial_enabled_at);
