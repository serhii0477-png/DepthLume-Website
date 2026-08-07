# DepthLume Website Content Status

Last updated: 2026-08-07.

## Product model

- **DepthLume Radar** is the first active beta product for Windows.
- **DepthLume** is the future core product and is presented as the next roadmap stage.
- Public visitors can switch products through the Product menu and the product rail.
- Product selection changes the public page context: copy, hero interface, screenshots, features, workflow and CTA.

## DepthLume Radar public page

Available at `/radar/` and localized equivalents such as `/uk/radar/`.

Implemented content:

- Radar-specific hero title, description and beta actions.
- Current real Radar interface in the first screen.
- Radar capability cards and product workflow.
- Clear product boundary: analytics only, no account connection, order placement, financial advice or outcome promise.
- Three-image product gallery with previous/next buttons, keyboard navigation, counter and full-resolution links.

Approved Radar screenshots:

| Asset | Source | Purpose | Resolution |
| --- | --- | --- | --- |
| `depthlume-radar-live-2026-08.png` | screenshot 47 | Visual Radar and selected-market intelligence | 2545 × 1317 |
| `depthlume-radar-market-list.png` | screenshot 50 | Market List | 1882 × 1327 |
| `depthlume-radar-live-events.png` | screenshot 51 | Live Events | 1869 × 1056 |

The older `depthlume-radar-live.png` is retained as an earlier source asset but is no longer used by the live Radar page.

## DepthLume core platform content

The original localized marketing pages remain the future DepthLume platform presentation. Existing chart, order-flow, Delta/CVD, heatmap and workspace visuals belong to this future product context and must not be reused as Radar screenshots.

Before DepthLume becomes active, confirm its final feature set, product screenshots, release status and CTA. The same product-page structure used for Radar can then be applied to DepthLume.

## Localization

The site supports English, Ukrainian, Russian, Spanish, Brazilian Portuguese, German, Turkish and Simplified Chinese. Locale selection persists in the browser and is preserved when navigating between home, Radar and account pages.

Translations are professional drafts and still require native-speaker and legal review. Product screenshots may contain Ukrainian or English application UI; they are authentic product captures and are not redrawn by the website.

## Account and beta content

- Registration, email verification, login, logout and password reset pages exist.
- Authenticated visitors see account-aware header actions.
- The account dashboard displays application status, beta access and current release.
- Beta application, feedback, protected download and administrator release-management flows exist.
- Beta limit is currently 10 active users.

## Production email status

Resend integration exists in code but production delivery is not complete until both Cloudflare secrets are configured:

- `RESEND_API_KEY`
- `EMAIL_FROM`

`EMAIL_FROM` must use a sender domain verified in Resend. Real values must never be committed.

## Review still required

- Final company identity, official contact email and domain.
- Final logo, favicon and Open Graph preview.
- Legal review of privacy, terms, risk disclaimer and beta terms.
- Native-speaker review for all translated marketing and legal copy.
- Confirmed Windows requirements, supported exchanges and update policy.
- Resend domain verification and production secret configuration.
- End-to-end production tests for new-user email verification and password recovery.
