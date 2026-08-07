CREATE TABLE release_uploads (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  version TEXT NOT NULL UNIQUE,
  release_notes TEXT NOT NULL,
  supported_platform TEXT NOT NULL,
  is_active INTEGER NOT NULL CHECK (is_active IN (0,1)),
  created_by TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_release_uploads_expires_at ON release_uploads(expires_at);

ALTER TABLE software_releases ADD COLUMN uploaded_at TEXT;
