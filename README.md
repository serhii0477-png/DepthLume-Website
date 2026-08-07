# DepthLume Website

Official multilingual marketing site and secure beta-access portal for **DepthLume Radar**, a Windows desktop market analytics and order-flow research platform.

- Production: <https://depthlume-preview.pages.dev>
- Ukrainian Radar page: <https://depthlume-preview.pages.dev/uk/radar/>
- Repository: <https://github.com/serhii0477-png/DepthLume-Website>
- Full project handoff and continuation notes: [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md)

## Architecture

- Astro 7 static marketing UI with the existing design system and eight locales.
- Cloudflare Pages Functions for server APIs and private-route guards.
- Cloudflare D1 for users, sessions, applications, releases, feedback and download audit logs.
- Private Cloudflare R2 for release binaries and feedback attachments.
- PBKDF2-SHA256 password hashing, hashed opaque sessions, HttpOnly cookies, role checks, Origin/CSRF checks, prepared SQL, validation and rate limiting.

The public HTML remains static. Private data and files are returned only by authenticated Functions; hiding a frontend button is never treated as authorization.

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

Sign in as admin and upload EXE, MSI or ZIP at `/admin/`. Enter version, platform and release notes. Marking it active deactivates the previous release. Files never enter `public/` and have no public R2 URL. The Pages request limit means this implementation caps direct uploads at 95 MB.

## Email verification

With `RESEND_API_KEY` and `EMAIL_FROM`, verification and reset links are emailed. In `development`, APIs also return test links. Without a provider, new production accounts remain unverified by design.

Production Resend delivery is still pending. Configure both secrets in Cloudflare Pages only after verifying a sender domain in Resend; never put their real values in this repository.

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
- Production email requires a provider.
- Files over 95 MB require a multipart/direct-upload design.
- DepthLume Radar is analytics software, not a trading system or financial adviser.
