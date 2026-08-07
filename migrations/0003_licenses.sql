CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  product TEXT NOT NULL DEFAULT 'depthlume-radar',
  type TEXT NOT NULL DEFAULT 'beta',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked','expired')),
  starts_at TEXT NOT NULL,
  expires_at TEXT,
  max_devices INTEGER NOT NULL DEFAULT 1 CHECK (max_devices BETWEEN 1 AND 10),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES users(id)
);

CREATE INDEX idx_licenses_user_product ON licenses(user_id, product, status);

CREATE TABLE license_keys (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX idx_license_keys_license ON license_keys(license_id, status);

CREATE TABLE device_activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  device_id_hash TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT NOT NULL,
  activated_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  UNIQUE(license_id, device_id_hash)
);

CREATE INDEX idx_device_activations_license_active ON device_activations(license_id, revoked_at);

CREATE TABLE desktop_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  device_activation_id TEXT NOT NULL REFERENCES device_activations(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX idx_desktop_sessions_token ON desktop_sessions(token_hash, expires_at, revoked_at);
