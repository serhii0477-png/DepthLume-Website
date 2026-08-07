export const canManageLicenses = (user) => user?.role === 'admin';

export const licenseStateCode = (license, now = new Date().toISOString()) => {
  if (!license?.emailVerified) return 'email_unverified';
  if (license.accessStatus !== 'beta') return 'no_radar_access';
  if (license.keyStatus !== 'active') return 'invalid_license_key';
  if (license.status === 'suspended') return 'suspended';
  if (license.status === 'revoked') return 'revoked';
  if (license.status !== 'active' || license.startsAt > now || (license.expiresAt && license.expiresAt <= now)) return 'expired';
  return null;
};

export const canActivateAnotherDevice = (activeDevices, maxDevices) => activeDevices < maxDevices;
