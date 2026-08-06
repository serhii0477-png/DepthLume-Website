# DepthLume Website

Local visual prototype for the official DepthLume website. DepthLume is a professional Windows desktop market analytics and order-flow research platform for cryptocurrency futures traders.

This iteration is a static multilingual website in English, Ukrainian, Russian, Spanish, Brazilian Portuguese, German, Turkish and Simplified Chinese. It does not include deployment, accounts, payments, analytics, a backend or live application data.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Local development

```bash
npm install
npm run dev
```

Astro prints the local URL, normally `http://localhost:4321`.

## Verification and production build

```bash
npm run check
npm run build
npm run preview
```

The static production output is generated in `dist/`.

## Directory structure

```text
public/                  Static assets, favicon and robots.txt
  images/product/       Approved product screenshots (when supplied)
src/
  components/           Reusable Astro interface components
  config/               Central site and navigation configuration
  data/                 Shared product content
  layouts/              Global page shell and SEO
  pages/                Static routes
  styles/               Tokens, reset, typography, components and utilities
```

## Product screenshot workflow

The protected source is `source-assets/depthlume-terminal-original.png`. Never publish or display it directly: it contains unsafe legacy branding and historical signal-journal material.

Generate safe derivatives using deterministic cropping only:

```bash
python scripts/generate-product-crops.py
```

Generated files live in `public/images/product/`: `depthlume-chart.webp`, `depthlume-chart-640.webp`, `depthlume-delta-cvd.webp`, `depthlume-heatmap.webp` and `depthlume-market-context.webp`. Exact coordinates are recorded in `CONTENT_STATUS.md` and the script. Visually inspect every regenerated image, then run `npm run build`. Missing derivatives produce an intentional fallback.

## Replace logo and favicon assets

- The current layered-depth SVG mark in `BrandMark.astro` is provisional.
- `public/favicon.svg` uses the same code-native geometry and should be replaced only after brand approval.
- Preserve accessible text for the logo and provide equivalent light/dark variants if new assets require them.

## Current limitations

- Safe real product crops are integrated; additional interface categories remain pending.
- Contact email is a centralized placeholder in `src/config/site.ts`.
- Confirmed supported markets, exchanges and system requirements are pending.
- Closed beta access is not open and no form is connected.
- Legal pages are preliminary and require final legal review.
- All translations require native-speaker review before launch.
- Interface previews contain no live or fabricated market values.

## Deployment

Deployment is deliberately not configured in this iteration. The domain, Cloudflare Pages and all other hosting services remain untouched.

## Localization architecture

- Locale and route mapping: `src/i18n/locales.ts`.
- Strict typed dictionaries: `src/i18n/translations.ts`.
- Shared localized template: `src/components/LocalizedPage.astro`.
- Static route generator: `src/pages/[lang]/[...page].astro`.
- English stays at root; localized prefixes are `/uk/`, `/ru/`, `/es/`, `/pt-br/`, `/de/`, `/tr/` and `/zh-cn/`.
- Every locale includes home, documentation, closed beta, privacy, terms and risk disclaimer.

Route sets are `/`, `/documentation/`, `/closed-beta/`, `/privacy/`, `/terms/`, `/risk-disclaimer/` and the same six paths beneath each of `/uk/`, `/ru/`, `/es/`, `/pt-br/`, `/de/`, `/tr/` and `/zh-cn/`.

To add a locale, extend `Locale` and `localeConfig`, supply a complete `Translation` object, and add it to `translations`. Missing keys and fixed-length content groups fail type checking. Run `npm run check` and `npm run build`; the build validator checks routes, SEO alternates, links and unsafe strings.
