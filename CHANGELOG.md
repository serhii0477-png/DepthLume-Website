# Changelog

## 2026-08-08 — Commercial access and direct TRC20 renewal

- Replaced manual beta approval for new commercial users with verified-email self-service access: one 7-day trial, one permanent desktop activation key and email delivery through Resend.
- Added a billing cabinet and administrator payment/license visibility.
- Added direct USDT TRC20 payment orders with a fixed merchant address, unique exact amounts, QR display, TxID confirmation, confirmed-chain validation, replay protection and automatic 30-day license extension.
- Restored administrator private R2 archive upload, progress and release controls after a client-side script regression.
- Corrected legacy beta entitlement classification: an older license without commercial expiry metadata now returns `complimentary` access rather than a misleading paid `subscription` status.
- The current direct TRC20 method is manual renewal, not automatic recurring charging.

## 2026-08-07 — Website checkpoint

### Custom production domain

- Set `https://depthlume.com` as the canonical `APP_URL` for email links and documented it as the public production origin.
- Added `https://depthlume.com` to private R2 release-upload CORS while retaining the legacy `pages.dev` origin for safe transition.
- Verified the production custom domain and direct private R2 release upload flow.

### Secure large release delivery

- Replaced the Pages Function binary-upload path with a short-lived, server-signed direct `PUT` upload to the private R2 bucket.
- Release files are restricted to `.exe`, `.msi` and `.zip`, with a 1 GiB maximum size.
- The backend verifies the R2 object’s existence, size and content type before creating D1 release metadata.
- Added upload progress, finalization status, safe non-JSON error handling and R2 diagnostics to `/admin/`.
- Added protected deletion for an inactive release that has no download audit records.

### Radar licensing

- Added D1 schema for licenses, hashed license keys, device activations and short-lived desktop sessions.
- Added `activate`, `validate` and `deactivate` HTTPS APIs for the Radar desktop application.
- Added administrator-only Radar license issuance and status management to `/admin/`.
- License keys and desktop tokens are never stored or logged in plaintext; the displayed activation key is available only once.
- License checks retain the existing website account, beta-access and protected-download model.
- Verified the complete live beta flow: administrator approval, protected download, one-time key issuance and desktop activation.

### Account verification

- Registration now safely resends a verification email for an existing unverified account, while invalidating earlier unused verification links and retaining an account-enumeration-safe response.
- Configured and verified production Resend delivery through a verified sender domain; secret values remain outside Git.

### Verification

- `npm run test` — 12 passing tests.
- `npm run check` — no errors or warnings.
- `npm run build` — completed successfully.
