PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  access_status TEXT NOT NULL DEFAULT 'none' CHECK (access_status IN ('none','pending','beta','waitlist','revoked')),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  beta_granted_at TEXT,
  beta_revoked_at TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE beta_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_city TEXT,
  operating_system TEXT NOT NULL,
  pc_specifications TEXT NOT NULL,
  use_case TEXT NOT NULL,
  ready_to_report_bugs INTEGER NOT NULL CHECK (ready_to_report_bugs IN (0,1)),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','waitlist','withdrawn')),
  admin_comment TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id)
);

CREATE UNIQUE INDEX one_active_application_per_user
ON beta_applications(user_id)
WHERE status IN ('pending','approved','waitlist');

CREATE TABLE software_releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  storage_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  release_notes TEXT NOT NULL,
  supported_platform TEXT NOT NULL DEFAULT 'Windows 10/11 x64',
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX one_active_release ON software_releases(is_active) WHERE is_active = 1;

CREATE TABLE download_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  release_id TEXT NOT NULL REFERENCES software_releases(id),
  downloaded_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('bug','suggestion','other')),
  software_version TEXT NOT NULL,
  description TEXT NOT NULL,
  reproduction_steps TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  attachment_key TEXT,
  attachment_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  client_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_hash ON sessions(token_hash, expires_at);
CREATE INDEX idx_applications_status_created ON beta_applications(status, created_at DESC);
CREATE INDEX idx_users_access_created ON users(access_status, created_at DESC);
CREATE INDEX idx_downloads_release_date ON download_logs(release_id, downloaded_at DESC);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX idx_rate_limits_lookup ON rate_limits(action, client_key, created_at);

