# DepthLume Design System — Deep Ocean Intelligence

## Principles

1. **Depth with restraint.** Layered dark surfaces suggest analytical depth without neon spectacle.
2. **Evidence before assertion.** Interfaces expose support, conflict, risk, invalidation and data quality.
3. **Calm precision.** Dense information uses clear rhythm, thin boundaries and deliberate typography.
4. **Truthful representation.** Concept previews and missing assets are always labelled.
5. **Accessible control.** Focus states, semantic landmarks, native controls and reduced-motion support are baseline behavior.

## Color roles

Tokens live in `src/styles/tokens.css`.

| Role | Token | Purpose |
| --- | --- | --- |
| Ocean base | `--color-ocean-950` | Main page background |
| Ocean layer | `--color-ocean-900` | Header and deep surfaces |
| Graphite panel | `--color-panel` | Primary analytical panels |
| Raised panel | `--color-panel-raised` | Hover and elevated surfaces |
| Whale Cyan | `--color-cyan` | Identity, focus and primary action |
| Control Blue | `--color-blue` | Selected controls and secondary emphasis |
| Market Green | `--color-green` | Buying/positive market direction only |
| Market Red | `--color-red` | Selling/negative market direction only |
| Warning Amber | `--color-amber` | Risk, warning and pending states |

### Direction-color rules

Correct:

- Green for buy-side or LONG market context.
- Red for sell-side or SHORT market context.
- Amber for WAIT, warning, degraded or unconfirmed states.
- Cyan for brand, interaction and neutral analytical emphasis.

Incorrect:

- Green for generic success messages or primary buttons.
- Red for decorative glow, brand emphasis or urgency marketing.
- Amber for normal navigation or promotional highlights.
- Any direction color implying profitability.

## Typography

The interface uses the local system sans-serif stack to avoid third-party font requests. Market labels and tabular values use the system monospace stack. Headings use moderate weight and tight tracking; long copy remains comfortably spaced.

## Spacing

Spacing follows a compact scale from `--space-1` through `--space-7`. Major sections use responsive `--space-7`; internal panel spacing normally uses `--space-3` or `--space-4`.

## Borders and radii

Thin translucent blue-grey borders separate analytical layers. Radii are modest: 8px for controls, about 14px for panels and about 20px only for large grouped surfaces.

## Shadows

Shadows communicate layer order, not decoration. Cyan glow is restricted to focus areas and the main workspace composition. Avoid broad neon halos.

## Motion

Motion is short, calm and functional. Hover elevation uses the shared ease-out curve. The context orbit moves very slowly and is disabled by `prefers-reduced-motion`.

## Responsive behavior

- Desktop canvas: optimized through 1920 × 1080.
- Laptop: complete content at 1366 × 768 without relying on viewport height.
- Tablet: complex two-column layouts collapse below 980px or 760px.
- Mobile: single-column reading order at 390px and a hard minimum width of 320px.
- Mobile navigation uses a real button, explicit expanded state, Escape handling and focus movement.
- No component may depend on horizontal scrolling.

## Layered product-image composition

The hero uses one dominant chart crop as the terminal anchor. Market Context and Delta/CVD overlap only at restrained edges and never cover hero copy. Perspective is desktop-only; mobile shows no more than the chart and one context layer.

## Real screenshot rules

- Never use the raw source screenshot in public markup or CSS.
- Only derivatives listed in `CONTENT_STATUS.md` are approved.
- Do not redraw, inpaint, translate or fabricate values inside screenshots.
- Every real product composition carries the approved development-interface caption.
- Essential website labels should be at least approximately 12 CSS pixels on desktop; smaller labels may be decorative only.
- Prefer meaningful crops over shrinking the full application UI.

## Language selector

Desktop uses native `details`/`summary` semantics and a bounded menu. Escape closes it and returns focus. Mobile presents flat language links with comfortable targets. The URL locale is authoritative and switching preserves the equivalent page.

Flags are prohibited because languages do not map one-to-one to countries.

## Multilingual typography

Preserve readable line height when translations expand. Simplified Chinese falls back through `Microsoft YaHei`, `PingFang SC` and `Noto Sans CJK SC`. Do not force narrow Latin metrics onto CJK copy. All current locales use left-to-right direction.
