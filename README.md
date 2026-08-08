# DepthLume Website

Official multilingual marketing site and secure beta-access portal for **DepthLume Radar**, a Windows desktop market analytics and order-flow research platform.

- Production: <https://depthlume.com>
- Ukrainian Radar page: <https://depthlume.com/uk/radar/>
- Repository: <https://github.com/serhii0477-png/DepthLume-Website>
- Full project handoff and continuation notes: [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md)
- Change history and the current checkpoint: [`CHANGELOG.md`](CHANGELOG.md)

## Architecture

- Astro 7 static marketing UI with the existing design system and eight locales.
- Cloudflare Pages Functions for server APIs and private-route guards.
- Cloudflare D1 for users, sessions, applications, releases, desktop licenses, feedback and download audit logs.
- Private Cloudflare R2 for release binaries and feedback attachments.
- PBKDF2-SHA256 password hashing, hashed opaque sessions, HttpOnly cookies, role checks, Origin/CSRF checks, prepared SQL, validation and rate limiting.

The public HTML remains static. Private data and files are returned only by authenticated Functions; hiding a frontend button is never treated as authorization.

## Current checkpoint

The direct private R2 release upload flow is deployed. Website-side licensing uses automatic verified-email access: starting a 7-day trial creates one permanent key, shows it in the billing cabinet and emails it through Resend. Monthly direct USDT TRC20 renewal uses a unique payment amount and confirmed TxID. Production origin is `https://depthlume.com`. Do not reuse a key if it was copied incorrectly: create a replacement and revoke the old license, because raw keys are intentionally unrecoverable.

## Current product structure

- **DepthLume Radar** is the active Windows beta product. It has a dedicated localized public page at `/radar/` and every locale prefix, including `/uk/radar/`.
- **DepthLume** is the future core platform and currently remains a roadmap product on the original localized marketing pages.
- The Product menu and product rail switch between these two product contexts.
- The Radar page uses current real product screenshots. Its lower gallery contains Visual Radar, Market List and Live Events views with previous/next controls, keyboard arrows and full-resolution image links.
- Locale choice is stored in `localStorage` under `depthlume.locale` and is preserved across public product and portal navigation.

## Requirements

- Node.js 24+
- npm 11+
- Cloudflare account with Pages, D1 and R2

## Install and UI development

```bash
npm install
npm run dev
```

`npm run dev` previews marketing UI only. API routes require the full Pages runtime.

## Full local stack

1. Copy `.env.example` to `.dev.vars` and set a long random `ADMIN_BOOTSTRAP_SECRET`.
2. Run `npm run db:migrate:local`.
3. Run `npm run dev:full` and open `http://localhost:8788`.

Local D1 and R2 data persists under ignored `.wrangler/state`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ENV` | yes | `development` locally, `production` on Cloudflare |
| `APP_URL` | yes | Public origin used in email links |
| `BETA_LIMIT` | yes | Maximum active beta users; default `10` |
| `ADMIN_BOOTSTRAP_SECRET` | until first admin | One-time administrator creation secret |
| `R2_ACCOUNT_ID` | large release uploads | Cloudflare account ID used only to construct a presigned R2 URL |
| `R2_ACCESS_KEY_ID` | large release uploads | Bucket-scoped R2 S3 API token access key; set as a secret |
| `R2_SECRET_ACCESS_KEY` | large release uploads | Bucket-scoped R2 S3 API token secret; set as a secret |
| `RESEND_API_KEY` | production email | Optional verification/reset provider |
| `EMAIL_FROM` | with Resend | Verified sender address |

Never commit `.dev.vars`, production secrets or Cloudflare credentials.

## Cloudflare resources and migrations

The current production resource bindings are already recorded in `wrangler.toml`. For a new Cloudflare account or cloned environment, create equivalent resources, replace the D1 `database_id`, then migrate:

```bash
npx wrangler d1 create depthlume-website
npx wrangler r2 bucket create depthlume-private-releases
npm run db:migrate:remote
```

Configure Pages bindings `DB` (D1) and `RELEASES` (R2). Migration `migrations/0001_initial.sql` creates all tables and indexes and contains no password.

The subsequent migrations are required in order: `0002_release_uploads.sql` for large release uploads and `0003_licenses.sql` for DepthLume Radar desktop licensing.

## Create the first administrator

This works only while no administrator exists:

```bash
curl -X POST http://localhost:8788/api/auth/bootstrap-admin \
  -H "content-type: application/json" \
  -H "x-bootstrap-secret: YOUR_LONG_SECRET" \
  -d '{"name":"Administrator","email":"admin@example.com","password":"replace-with-a-strong-password"}'
```

After success, remove `ADMIN_BOOTSTRAP_SECRET` from production.

## Beta flow

1. User registers and verifies email.
2. User submits one active application at `/apply/`.
3. Admin reviews it at `/admin/`.
4. D1 checks the active `beta` count in the same transactional batch that grants access. User 11 is moved to `waitlist`.
5. `/api/download` rechecks session, `beta` status and active release, streams private R2 content and logs the event.

## Publish a new release

Sign in as admin and upload EXE, MSI or ZIP (up to **1 GiB**) at `/admin/`. Enter version, platform and release notes. The browser first receives a 15-minute presigned `PUT` authorization for one server-generated R2 object key, uploads directly to the private R2 bucket, then asks the backend to finalize. The backend confirms the object exists and its type and size match before it writes release metadata to D1. Marking a release active deactivates the previous active release. Files never enter `public/`, receive no permanent public URL, and beta downloads still stream only through `/api/download`.

Before the first production large upload, create an R2 S3 API token restricted to **Object Read & Write** on `depthlume-private-releases`, then set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` as Cloudflare Pages production secrets. Never expose these values in browser code or Git. Configure R2 bucket CORS to allow only the website origin and `PUT` with `Content-Type`, for example:

```json
[
  {
    "AllowedOrigins": ["https://depthlume.com", "https://depthlume-preview.pages.dev"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Apply it in R2 bucket **Settings → CORS Policy**, or use the included CLI-format file with `npx wrangler r2 bucket cors set depthlume-private-releases --file r2-release-cors.json`. The configuration includes the production custom domain and retains the legacy `pages.dev` address during the transition. The bucket remains private.

## Email verification

With `RESEND_API_KEY` and `EMAIL_FROM`, verification and reset links are emailed. Registering an already existing but unverified email safely issues a fresh verification link and invalidates its earlier unused links. In `development`, APIs also return test links. Without a provider, new production accounts remain unverified by design.

Production Resend delivery uses a verified sender domain. Keep `RESEND_API_KEY` and `EMAIL_FROM` as Cloudflare Pages secrets only; never put their real values in this repository. If delivery stops, first check the Resend email activity log and sender-domain status.

## Desktop licensing

The website is the licensing authority; the Radar executable never receives Cloudflare, R2, admin or account-password credentials. The desktop app calls these HTTPS endpoints:

- `POST /api/licenses/activate` — accepts a license key and one random installation ID, creates/reuses one device activation and returns a 24-hour opaque desktop token.
- `POST /api/licenses/validate` — checks the desktop token, device and current beta/license state, then rotates the token.
- `POST /api/licenses/deactivate` — revokes the token and frees that device slot.

All desktop tokens and license keys are stored in D1 only as SHA-256 hashes. The raw activation key is shown once in the billing cabinet and simultaneously emailed to the verified user. The API never exposes a public release binary URL and does not change the existing protected `/api/download` flow.

Users do not need administrator approval for standard access: after email verification they start a 7-day trial in `/account/billing/`, receive their permanent key on screen and by email, then activate one device. Administrators can inspect payments and licenses in `/admin/`; suspending or revoking a license blocks the next validation and revokes active desktop sessions.

For the desktop build, set its `DEPTHLUME_LICENSE_API_URL` to the stable production Pages origin, for example:

```powershell
[Environment]::SetEnvironmentVariable(
  "DEPTHLUME_LICENSE_API_URL",
  "https://depthlume.com",
  "User"
)
```

No new Pages binding or secret is needed for licensing: it uses the existing private `DB` binding. Apply the D1 migration before deploying code that uses these endpoints:

```bash
npm run db:migrate:remote
```

## Verification

```bash
npm run test
npm run check
npm run build
npm audit
```

Tests cover the beta boundary, download policy and CTA state. Build validation checks all existing localized public routes, SEO alternates and internal links.

## Deployment

Use Wrangler or connect GitHub to Cloudflare Pages. Build command: `npm run build`; output: `dist`. Pages Functions bundle automatically from `functions/`. Apply migrations and configure D1/R2 before using auth routes.

Current manual production command:

```bash
npx wrangler pages deploy dist --project-name=depthlume-preview --branch=main
```

## Limitations

- Legal copy needs counsel review.
- Translations need native-speaker review.
- Production email depends on the configured Resend sender domain and API key remaining active.
- Direct release upload uses a single presigned R2 `PUT`; it supports releases up to 1 GiB. An interrupted upload must be restarted. Move to presigned multipart upload only when resumability or releases above 1 GiB are required.
- DepthLume Radar is analytics software, not a trading system or financial adviser.
