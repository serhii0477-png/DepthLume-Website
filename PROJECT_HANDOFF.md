# DepthLume Website — Project Handoff

This document is the working context for continuing the project in a new Codex or ChatGPT conversation. Last updated: **2026-08-07**.

## Checkpoint: 2026-08-07

The project is being preserved after two completed infrastructure changes:

1. **Large private releases** use a direct, 15-minute signed R2 `PUT`, then D1 finalization after the backend verifies the object. This flow has been deployed and a Radar release was successfully uploaded privately.
2. **Radar licensing** is implemented locally in this repository: D1 migration `0003_licenses.sql`, the three desktop API endpoints, and the administrator license interface are ready. Tests, type checking and production build pass. It must be deployed and its migration applied before desktop activation can be considered live.

The existing beta account model remains the source of truth. An administrator must grant a verified account beta access before issuing it a license. A raw `DL-...` activation key appears one time only. If it is copied with additional text or lost, revoke that license and issue a replacement instead of trying to recover the original key.

## 1. Project locations

- Local workspace: `E:\DepthLumeWebsite`
- GitHub: <https://github.com/serhii0477-png/DepthLume-Website>
- Public production site: <https://depthlume-preview.pages.dev>
- Main Ukrainian page: <https://depthlume-preview.pages.dev/uk/>
- Ukrainian DepthLume Radar page: <https://depthlume-preview.pages.dev/uk/radar/>
- Cloudflare Pages project: `depthlume-preview`
- Production branch configured in Cloudflare: `main`

Do not confuse `preview.depthlume-preview.pages.dev` or hash-prefixed deployment URLs with the public production address. Preview deployments are protected by Cloudflare Access; the stable `depthlume-preview.pages.dev` address is public.

## 2. Current product architecture

The website supports multiple products rather than treating DepthLume as one fixed page.

### DepthLume Radar

- First active beta product for Windows.
- Has a dedicated complete localized marketing page at `/radar/` and each locale prefix.
- Ukrainian route: `/uk/radar/`.
- Hero, descriptions, capabilities, workflow, boundaries and screenshots all refer specifically to Radar.
- Current interface screenshot is used in the hero.
- A lower screenshot gallery contains three authentic views:
  1. Visual Radar — `public/images/product/depthlume-radar-live-2026-08.png`
  2. Market List — `public/images/product/depthlume-radar-market-list.png`
  3. Live Events — `public/images/product/depthlume-radar-live-events.png`
- Gallery controls: left/right buttons, keyboard arrows, slide counter and links to full-resolution originals.

### DepthLume

- Future core platform shown as the next product after Radar beta.
- Existing original multilingual marketing pages and the Intelligence Workspace composition represent this future product.
- It must later receive the same independent product treatment as Radar: dedicated final copy, real screenshots, release state and CTA.

### Product navigation

- `SiteHeader.astro` provides a Product menu on desktop and mobile.
- `LocalizedPage.astro` and `RadarProductPage.astro` provide the visible product rail.
- Selecting Radar navigates to the localized Radar route instead of merely changing a label.
- Selecting DepthLume returns to the localized core home page.

## 3. Localization behavior

Supported locales:

- English at `/`
- Ukrainian `/uk/`
- Russian `/ru/`
- Spanish `/es/`
- Brazilian Portuguese `/pt-br/`
- German `/de/`
- Turkish `/tr/`
- Simplified Chinese `/zh-cn/`

The browser stores the selected locale in `localStorage` as `depthlume.locale`. The stored language is restored on later visits and is preserved when opening Radar or account routes. Portal pages default to Ukrainian when no saved locale exists.

When authenticated, the global header checks `/api/auth/me`. It changes the action to the localized logout label and sends `POST /api/auth/logout`; otherwise it shows the login action. The separate account link remains available.

## 4. Technical stack

- Astro 7 static site, TypeScript and local CSS design system.
- Cloudflare Pages for static hosting and Functions.
- Cloudflare D1 binding `DB`, database `depthlume-website`.
- Cloudflare R2 binding `RELEASES`, private bucket `depthlume-private-releases`.
- Pages Functions under `functions/`.
- D1 migrations: `0001_initial.sql` (core), `0002_release_uploads.sql` (large releases), `0003_licenses.sql` (desktop licensing).
- Public form/admin scripts under `public/scripts/`.

`wrangler.toml` contains resource identifiers and non-secret production variables. Secrets are managed only in Cloudflare.

## 5. Implemented account and beta system

Public/portal routes include:

- `/register/`
- `/login/`
- `/forgot-password/`
- `/reset-password/`
- `/verify-email/`
- `/apply/`
- `/account/`
- `/admin/`
- `/beta-terms/`

Implemented API capabilities:

- One-time administrator bootstrap.
- Registration and email verification tokens.
- Login/logout and secure session cookies.
- Password recovery and one-time reset tokens.
- Current-user endpoint.
- Beta applications and 10-seat enforcement.
- User account dashboard.
- Feedback and private attachments.
- Administrator dashboard and access decisions.
- Private direct-to-R2 release upload/activation: an administrator obtains a 15-minute presigned `PUT` URL for one server-generated key, the browser uploads straight to private R2, and `/finalize` verifies the object before D1 metadata is created.
- Protected release download and audit logging.
- Desktop Radar licensing: admin-only beta-license key issuance, device activation limits, short-lived hashed desktop sessions, validate/deactivate APIs and license suspension/revocation.

Security controls include PBKDF2-SHA256 password hashing at **100,000 iterations** (adjusted from 210,000 for the Cloudflare Workers Web Crypto limit), hashed opaque sessions, HttpOnly/SameSite cookies, role and access checks, Origin/CSRF checks, validation, prepared SQL and D1 rate limiting.

The first production administrator has already been created and verified. Never add administrator email, password or bootstrap secret to documentation or Git.

### Desktop licensing flow

The API endpoints are `POST /api/licenses/activate`, `/api/licenses/validate` and `/api/licenses/deactivate`. They are intended for the installed Radar client, which supplies a random per-installation ID and keeps returned tokens in Windows DPAPI. License keys and tokens are stored in D1 as hashes only; their raw values are never written to logs.

At `/admin/`, first grant a verified account beta access, then create its Radar license key. The raw key appears exactly once, so copy it before closing the message. Default device limit is one. Suspension/revocation invalidates current desktop sessions; device deactivation frees the slot. The desktop environment variable must point to the stable public Pages origin:

```powershell
[Environment]::SetEnvironmentVariable("DEPTHLUME_LICENSE_API_URL", "https://depthlume-preview.pages.dev", "User")
```

Before the feature is deployed, run `npm run db:migrate:remote`; this applies `0003_licenses.sql`. Licensing uses the existing `DB` D1 binding and needs no extra Cloudflare secret or public R2 configuration.

## 6. Cloudflare production state

Configured resources:

- Pages project: `depthlume-preview`
- D1 database: `depthlume-website`
- R2 bucket: `depthlume-private-releases`
- Production URL: `https://depthlume-preview.pages.dev`
- `APP_ENV=production`
- `APP_URL=https://depthlume-preview.pages.dev`
- `BETA_LIMIT=10`

The production build is deployed manually with:

```powershell
cd E:\DepthLumeWebsite
npm run build
npx wrangler pages deploy dist --project-name=depthlume-preview --branch=main
```

After deployment, verify the stable production URL, not only the hash-prefixed deployment URL. Cloudflare propagation can take approximately one minute.

## 7. Secrets and email

Never commit `.dev.vars`, `.env`, Cloudflare tokens, passwords or secret values.

Expected secrets:

- `ADMIN_BOOTSTRAP_SECRET` — used only for the first administrator; remove or rotate it after bootstrap.
- `RESEND_API_KEY` — still needs production configuration.
- `EMAIL_FROM` — still needs production configuration and must use a Resend-verified domain.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — required for direct releases above the Pages request limit. Create a bucket-scoped R2 S3 API token with only Object Read & Write on `depthlume-private-releases`; save all three as Pages production secrets. Do not put them in `wrangler.toml` or Git.

For browser direct upload, configure the private R2 bucket's CORS policy for the exact production origin(s), `PUT`, and the `Content-Type` header. This does not make the bucket public. The required Pages binding remains `RELEASES`; no additional binding is needed. Run migration `0002_release_uploads.sql` before production deployment.

The Resend code path already exists in `functions/_lib/email.ts`. Registration and forgotten-password APIs call it. Until both Resend settings are present, new production users will not receive verification or reset messages.

## 8. Local development and verification

UI only:

```powershell
npm install
npm run dev
```

Full local Pages stack:

```powershell
Copy-Item .env.example .dev.vars
npm run db:migrate:local
npm run dev:full
```

Required checks before deployment:

```powershell
npm run test
npm run check
npm run build
```

The build validates localized routes, internal links, SEO alternates and prohibited unsafe text. Tests cover beta-seat enforcement, protected downloads and account CTA state.

## 9. Important files

- `README.md` — setup and operational overview.
- `CONTENT_STATUS.md` — approved/current public content and remaining review.
- `DESIGN_SYSTEM.md` — visual and semantic rules.
- `src/components/RadarProductPage.astro` — complete Radar marketing page.
- `src/components/RadarLiveVisual.astro` — real screenshot gallery.
- `src/components/SiteHeader.astro` — products, locale and authentication-aware navigation.
- `src/layouts/BaseLayout.astro` — global shell and locale restoration.
- `src/components/PortalPage.astro` — account/admin page shell.
- `functions/` — Cloudflare APIs and middleware.
- `migrations/0001_initial.sql` — D1 schema.
- `wrangler.toml` — Cloudflare bindings and public variables.

## 10. Known remaining work

1. Verify a sender domain in Resend and set `RESEND_API_KEY` plus `EMAIL_FROM` in Cloudflare production.
2. Test registration email verification and password recovery end to end.
3. Add the R2 S3 signing secrets and bucket CORS policy, apply migration `0002_release_uploads.sql`, then upload the first approved private DepthLume Radar release through `/admin/`.
4. Apply `0003_licenses.sql`, deploy the license APIs, create a beta test key in `/admin/`, then verify Radar activation, validation and device deactivation end to end.
5. Review beta application, approval, download and feedback flows with a non-admin test account.
6. Replace placeholder company/contact/legal details and obtain legal review.
7. Perform native-language review of all translations.
8. Add analytics/visitor reporting if not already enabled in Cloudflare Web Analytics.
9. When DepthLume itself is ready, create its dedicated product page using the Radar product-page pattern.
10. Add final logo, favicon and social-sharing image.

## 11. Suggested prompt for a new ChatGPT conversation

> Continue development of the DepthLume website from the repository https://github.com/serhii0477-png/DepthLume-Website. First read README.md, PROJECT_HANDOFF.md, CONTENT_STATUS.md and DESIGN_SYSTEM.md. The public production site is https://depthlume-preview.pages.dev. DepthLume Radar is the active beta product at /uk/radar/; DepthLume is the future core product. Preserve the multilingual architecture, the authentication/beta portal, D1/R2 security boundaries and the current product-specific screenshot rules. Never commit or request secret values. Run npm run test, npm run check and npm run build before deployment.
