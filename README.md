# DiffViewer — Free Online Diff Checker

Compare two pieces of text or code side by side with line-level and word-level highlighting. Built with React, TypeScript, Vite and Monaco Editor.

**Live:** <vercel-Live-Link>

## Features

- Side-by-side diff with Monaco Editor
- Word-level highlighting for the selected line, editable in place
- Syntax highlighting for 15 languages (JS, TS, JSON, HTML, CSS, Python, SQL and more)
- Light and dark themes (remembers your choice)
- Comparison runs in your browser; your text is not uploaded
- Responsive layout (desktop, tablet, mobile)
- Built-in blog with per-page SEO

## Tech stack

React 19 · TypeScript · Vite · Monaco Editor · Vercel

## Getting started

```bash
git clone https://github.com/ujjwalraj123/diffviewer.git
cd diffviewer
npm install
npm run dev      # http://localhost:4319
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project structure

```text
src/
  components/   Toolbar, editors, copy button, links
  pages/        ToolPage, BlogIndex, BlogPost, NotFound
  content/      posts.ts  ← blog posts live here
  config/       site.ts   ← site URL and default SEO text
  hooks/        useSeo, useTheme, useMonacoTheme, useSharedScroll
  lib/          router, wordDiff, lineMapping
  styles/       global.css, app.css, blog.css
public/         robots.txt, sitemap.xml, favicon.svg, og-image.png
```

## Routing

This is a single-page app with a small History API router (`src/lib/router.ts`):

- `/` — diff tool
- `/blog` — blog index
- `/blog/:slug` — blog post

`vercel.json` rewrites all paths to `index.html` so deep links work on refresh.

## Adding a blog post

1. Add an object to `POSTS` in `src/content/posts.ts` (slug, title, description, date, sections).
2. Add its URL to `public/sitemap.xml`.
3. Deploy. Title, meta description, canonical URL, Open Graph tags and `BlogPosting` JSON-LD are generated automatically by `useSeo`.

## SEO checklist

- [ ] Set your real domain in `src/config/site.ts`, `index.html`, `public/robots.txt` and `public/sitemap.xml`
- [ ] Add `public/og-image.png` (1200×630) and `public/favicon.svg`
- [ ] Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools
- [ ] Keep one `<h1>` per page and unique titles/descriptions

## Deployment (Vercel)

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

## Privacy

Text you paste is compared locally in your browser. Note that Monaco Editor's code is loaded from a CDN by `@monaco-editor/react`, but your content is not sent anywhere. Even so, avoid pasting secrets into any online tool unless you trust the deployment.

## Contributing

1. Create a branch
2. Make your changes
3. Run `npm run lint` and `npm run build`
4. Open a pull request

## License

Add your license here (for example MIT).