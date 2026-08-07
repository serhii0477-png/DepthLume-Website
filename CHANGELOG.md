# Changelog

## 2026-08-07 — Website checkpoint

### Custom production domain

- Set `https://depthlume.com` as the canonical `APP_URL` for email links and documented it as the public production origin.
- Added `https://depthlume.com` to private R2 release-upload CORS while retaining the legacy `pages.dev` origin for safe transition.

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

### Account verification

- Registration now safely resends a verification email for an existing unverified account, while invalidating earlier unused verification links and retaining an account-enumeration-safe response.

### Verification

- `npm run test` — 12 passing tests.
- `npm run check` — no errors or warnings.
- `npm run build` — completed successfully.
