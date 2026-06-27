# Chrome Web Store — Publishing Checklist

Use this checklist when submitting **Webpage Showcase** to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Before you submit

1. **Update metadata** in [`wxt.config.ts`](../wxt.config.ts):
   - `STORE_HOMEPAGE_URL` — developer portfolio (`https://ajay-develops.vercel.app`)
   - `author` in [`package.json`](../package.json) — Ajay Kumar

2. **Host the privacy policy** (required because the extension uses broad host access):
   - Canonical file: [`docs/privacy-policy.html`](../docs/privacy-policy.html) (deployed via GitHub Pages)
   - Setup guide: [`store/GITHUB_PAGES_SETUP.md`](GITHUB_PAGES_SETUP.md)
   - Live URL (after deploy): `https://ajay-develops.github.io/webpage-showcase-chrome-extension/privacy-policy.html`
   - Paste that URL into the store listing **Privacy policy** field

3. **Store listing copy**: [`store/STORE_LISTING.md`](STORE_LISTING.md) — short + long descriptions ready to paste

4. **Build the upload zip**:

   ```bash
   npm install
   npm run zip
   ```

   Upload the zip from `output/` (e.g. `webpage-showcase-1.0.0-chrome.zip`).

5. **Store listing assets** (create outside the repo):

   | Asset | Size | Notes |
   |-------|------|-------|
   | Icon | 128×128 PNG | Already in extension (`public/icon/128.png`) |
   | Screenshots | 1280×800 or 640×400 | Popup + page overlay during tour |
   | Small promo tile | 440×280 | Optional |
   | Marquee promo | 1400×560 | Optional |

6. **Permission justifications** (paste in dashboard when asked):

   | Permission | Justification |
   |------------|---------------|
   | `storage` | Saves per-website scroll tour configs locally on the user's device. |
   | `activeTab` | Accesses the current tab only when the user clicks Start or Stop. |
   | `scripting` | Injects the scroll engine into the active tab when the user clicks Start or Stop. |

   No broad host permissions (`<all_urls>`). The extension does not access sites in the background.

7. **Single purpose description** (example):

   > Automates cinematic vertical scrolling on webpages so users can record polished product demo videos.

## Developer account

- One-time **$5 USD** [Chrome Web Store developer registration](https://chrome.google.com/webstore/devconsole/register)
- Verify your email and enable 2FA on your Google account

## After approval

- Bump `version` in `package.json` for each release (Chrome rejects duplicate versions)
- Run `npm run zip` and upload the new zip as an update
- Review time is typically 1–3 business days for new extensions

## Regenerate icons

If you edit [`assets/icon.png`](../assets/icon.png):

```bash
npm run generate-icons
npm run build
```
