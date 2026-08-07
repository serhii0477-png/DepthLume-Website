export interface Env {
  DB: D1Database;
  RELEASES: R2Bucket;
  APP_ENV?: string;
  APP_URL?: string;
  BETA_LIMIT?: string;
  ADMIN_BOOTSTRAP_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export type Role = 'user' | 'admin';
export type AccessStatus = 'none' | 'pending' | 'beta' | 'waitlist' | 'revoked';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  accessStatus: AccessStatus;
  emailVerified: boolean;
  betaGrantedAt: string | null;
  betaRevokedAt: string | null;
}

