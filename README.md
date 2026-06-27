# Webpage Showcase

**Webpage Showcase** is a Chrome/Edge browser extension that automatically scrolls through any webpage in a cinematic, predictable way — so you can screen-record polished product demos without manual scrolling.

Stop wrestling with your mouse to get the perfect scroll speed. Webpage Showcase turns your browser into a professional camera dolly, giving you cinematic, repeatable, and tunable scrolls every single time.

Built for founders, developers, and marketers who need repeatable landing page walkthrough videos.

## What it does

Webpage Showcase is **not** a screen recorder. It only automates scroll timing on the page:

1. **Fast-scroll** to each section's top
2. **Brief pause** at the section start
3. **Slow scroll-through** of the entire section (top → bottom)
4. **Optional pause** at section end
5. **Fast-scroll** to the next section (skipping empty gaps)

Press **Esc** anytime to abort. A small overlay pill shows current status.

## Recommended recording setup

- Viewport: **1440×900** or **1280×800**
- Hide dev chrome / cookie banners with `[data-showcase-hide]` on elements you control, or configure sections to skip them
- Start your screen recorder **after** clicking Start Showcase (optional countdown gives you time)

## Install (development)

```bash
npm install
npm run build
```

Load unpacked in Chrome/Edge:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `output/chrome-mv3`

For development with hot reload:

```bash
npm run dev
```

## Chrome Web Store

See [`store/GITHUB_PAGES_SETUP.md`](store/GITHUB_PAGES_SETUP.md) for GitHub Pages setup and [`store/STORE_LISTING.md`](store/STORE_LISTING.md) for ready-to-paste store copy.

Quick steps:

1. Update `STORE_HOMEPAGE_URL` in [`wxt.config.ts`](wxt.config.ts) and `author` in [`package.json`](package.json)
2. Host [`store/privacy-policy.html`](store/privacy-policy.html) at a public HTTPS URL (required for `<all_urls>`)
3. Build the upload zip: `npm run zip`
4. Upload the zip from `output/` in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Extension icons live in [`public/icon/`](public/icon/). Regenerate from the source with `npm run generate-icons` after editing [`assets/icon.png`](assets/icon.png).

## Usage

1. Open any website (landing page, docs, marketing site)
2. Click the **Webpage Showcase** extension icon
3. First visit per domain: sections are **auto-detected** on first Start
4. Click **Start Showcase** — optional countdown, then automated tour
5. Start screen recording
6. Press **Esc** to stop early

Use **Configure Sections** to reorder, rename, edit selectors, and tune timing per site.

## Tuning scroll choreography

Global defaults (override per site in Options):

| Setting | Default | Purpose |
|---------|---------|---------|
| `headerOffsetPx` | 80 | Clearance for sticky headers |
| `fastTransitionDurationMs` | 1500 | Fast jump between sections |
| `sectionScrollPixelsPerSecond` | 150 | Slow scroll speed through section |
| `minSectionScrollDurationMs` | 2500 | Minimum hold for short sections |
| `maxSectionScrollDurationMs` | 14000 | Cap for very long sections |
| `sectionStartPauseMs` | 600 | Pause before scrolling each section |
| `heroSectionStartPauseMs` | 100 | Pause at first section only |
| `introDelayMs` | 200 | Delay before countdown |
| `countdownSeconds` | 1 | Set 0 to skip countdown |

Per-section overrides in Options or JSON:

```json
{
  "selector": "#hero",
  "label": "Hero",
  "startPauseMs": 100,
  "endPauseMs": 2000
}
```

## Config storage format

Configs are stored locally in `chrome.storage.local` keyed by hostname:

```json
{
  "www.example.com": {
    "stops": [
      { "selector": "#hero", "label": "Hero" },
      { "selector": "section:nth-of-type(2)", "label": "Features" }
    ],
    "globalOverrides": {
      "headerOffsetPx": 96,
      "sectionScrollPixelsPerSecond": 120
    },
    "updatedAt": "2026-06-27T00:00:00.000Z"
  }
}
```

Export/import full config JSON from the Options page.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Persist per-domain section configs locally |
| `activeTab` | Access the current tab when you click the extension |
| `scripting` | Inject scroll engine on demand |
| `<all_urls>` | Run on arbitrary sites + hostname-keyed configs |

**Tighter alternative:** `activeTab` only (no `<all_urls>`) limits injection to user-gestured tabs but prevents pre-loading configs for sites you haven't visited. This extension uses `<all_urls>` for smoother first-run auto-detect on any site.

## Privacy

- All data stays in **local browser storage**
- **No telemetry**, no cloud sync, no network requests in v1

## Limitations (v1)

- **SPAs:** route changes mid-tour abort the showcase
- **Horizontal layouts:** vertical scroll only
- **Cookie banners:** not auto-hidden; mark with `data-showcase-hide` or exclude from sections
- **`overflow: hidden` on body/html:** scrolling may fail — extension warns before starting
- **iframes:** main frame only
- **Manual scrolling mid-tour:** may cause visual jumps (no scroll lock in v1)

## Development

```bash
npm test        # Vitest — easing & duration math
npm run build   # Production extension bundle
npm run dev     # WXT dev server + HMR
```

## Project structure

```
src/
├── content/           # Scroll engine (pure DOM, no framework)
├── entrypoints/       # WXT entry points (background, content, popup, options)
├── types/             # Shared TypeScript types
├── defaults.ts        # Default global config
└── storage.ts         # chrome.storage.local helpers
```

The scroll engine (`showcase-engine.ts`) is intentionally portable — it could become a standalone `@page-showcase/core` package later.

Built by [Ajay Kumar](https://ajay-develops.vercel.app).

## License

ISC
