# GitHub Pages Setup — Webpage Showcase

This repo serves the privacy policy and a simple landing page from the [`docs/`](../docs/) folder via GitHub Actions.

## URLs after deployment

If your GitHub username is `ajay-develops` and repo name is `webpage-showcase-chrome-extension`:

| Page | URL |
|------|-----|
| Landing | `https://ajay-develops.github.io/webpage-showcase-chrome-extension/` |
| Privacy policy (use in Chrome Web Store) | `https://ajay-develops.github.io/webpage-showcase-chrome-extension/privacy-policy.html` |

## One-time setup (run these commands)

From the project folder:

```bash
# 1. Initialize git (if not already)
git init

# 2. Stage and commit
git add .
git commit -m "Initial commit: Webpage Showcase extension"

# 3. Create repo on GitHub (via browser or gh CLI)
#    Repo name suggestion: webpage-showcase-chrome-extension

# 4. Add remote and push
git branch -M main
git remote add origin https://github.com/ajay-develops/webpage-showcase-chrome-extension.git
git push -u origin main
```

### Enable GitHub Pages in repo settings

1. Open your repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, select **GitHub Actions**
3. Push to `main` (or run the workflow manually under **Actions** → **Deploy GitHub Pages** → **Run workflow**)
4. Wait ~1 minute; your site will be live at `https://ajay-develops.github.io/webpage-showcase-chrome-extension/`

## Update extension manifest

In [`wxt.config.ts`](../wxt.config.ts), `STORE_HOMEPAGE_URL` points to the developer portfolio:

```ts
// https://ajay-develops.vercel.app
```

Privacy policy remains on GitHub Pages (required for Chrome Web Store listing).

```bash
npm run zip
```

## Developer

**Ajay Kumar** — [ajay-develops.vercel.app](https://ajay-develops.vercel.app) · ajaydevelops38@gmail.com

## Chrome Web Store

Paste the privacy policy URL into the listing:

```
https://ajay-develops.github.io/webpage-showcase-chrome-extension/privacy-policy.html
```

## Updating the privacy policy

Edit [`docs/privacy-policy.html`](../docs/privacy-policy.html), commit, and push to `main`. GitHub Actions redeploys automatically.
