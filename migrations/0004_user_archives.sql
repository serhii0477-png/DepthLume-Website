-- Archiving is reversible and preserves records required for audit/history.
ALTER TABLE users ADD COLUMN archived_at TEXT;
ALTER TABLE users ADD COLUMN archived_by TEXT REFERENCES users(id);

CREATE INDEX idx_users_archived_created ON users(archived_at, created_at DESC);
