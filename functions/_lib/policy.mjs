export const ACCESS_STATUSES = ['none', 'pending', 'beta', 'waitlist', 'revoked'];
export const canDownload = (user, release) => Boolean(user && user.accessStatus === 'beta' && release?.isActive);
export const nextPrimaryAction = ({ authenticated, accessStatus, betaCount, betaLimit }) => {
  if (!authenticated) return 'login';
  if (accessStatus === 'beta') return 'download';
  if (accessStatus === 'pending') return 'pending';
  if (betaCount >= betaLimit) return 'waitlist';
  return 'apply';
};
export const canGrantBeta = (activeCount, limit = 10) => activeCount < limit;

