# DepthLume Website — Project Handoff

This document is the working context for continuing the project in a new Codex or ChatGPT conversation. Last updated: **2026-08-07**.

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
- D1 migration: `migrations/0001_initial.sql`.
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
- Private R2 release upload/activation.
- Protected release download and audit logging.

Security controls include PBKDF2-SHA256 password hashing at **100,000 iterations** (adjusted from 210,000 for the Cloudflare Workers Web Crypto limit), hashed opaque sessions, HttpOnly/SameSite cookies, role and access checks, Origin/CSRF checks, validation, prepared SQL and D1 rate limiting.

The first production administrator has already been created and verified. Never add administrator email, password or bootstrap secret to documentation or Git.

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
3. Upload the first approved private DepthLume Radar release through `/admin/`.
4. Review beta application, approval, download and feedback flows with a non-admin test account.
5. Replace placeholder company/contact/legal details and obtain legal review.
6. Perform native-language review of all translations.
7. Add analytics/visitor reporting if not already enabled in Cloudflare Web Analytics.
8. When DepthLume itself is ready, create its dedicated product page using the Radar product-page pattern.
9. Add final logo, favicon and social-sharing image.

## 11. Suggested prompt for a new ChatGPT conversation

> Continue development of the DepthLume website from the repository https://github.com/serhii0477-png/DepthLume-Website. First read README.md, PROJECT_HANDOFF.md, CONTENT_STATUS.md and DESIGN_SYSTEM.md. The public production site is https://depthlume-preview.pages.dev. DepthLume Radar is the active beta product at /uk/radar/; DepthLume is the future core product. Preserve the multilingual architecture, the authentication/beta portal, D1/R2 security boundaries and the current product-specific screenshot rules. Never commit or request secret values. Run npm run test, npm run check and npm run build before deployment.
