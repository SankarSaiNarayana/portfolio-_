# Portfolio

High-level personal site: glass-style UI on a sky-blue gradient. Replace placeholder copy, project links, and contact details in `index.html`.

## Commands

```bash
npm install
npm run dev
```

Build for static hosting:

```bash
npm run build
```

Deploy the `dist/` folder to any static host (GitHub Pages, Netlify, Vercel, etc.).

## Before you ship

1. **Domain & social previews** — In `index.html`, replace every `https://YOURDOMAIN.com/` with your real site URL (`canonical`, `og:url`, `og:image`, `twitter:image`).
2. **Résumé** — Add `public/resume.pdf` so the “Résumé (PDF)” button works (Vite copies `public/` to the site root).
3. **Source link** — Point “Site source” to your actual repo (`https://github.com/...`).
4. **OG image** — `public/og.svg` works for many platforms; LinkedIn often prefers a **1200×630 PNG/JPEG** — export one and set `og:image` / `twitter:image` to that file’s absolute URL.

## Built-in polish

- `theme-color`, Open Graph & Twitter cards, favicon (`public/favicon.svg`)
- Skip link, visible `:focus-visible` rings
- Footer **Reduce motion** toggle (saved in `localStorage` as `portfolio-reduce-motion`)
