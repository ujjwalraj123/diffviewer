# DiffViewer

DiffViewer is a free, browser-based tool for comparing two pieces of text or code. Edit or paste the original and modified versions, then inspect additions and deletions in a split or unified diff.

**Live app:** [diffviewer-weld.vercel.app](https://diffviewer-weld.vercel.app/)

## Features

- Compare text, code, JSON, configuration files, and other plain text.
- View changes side by side or in a unified layout.
- Inspect character-level changes within modified lines.
- Edit either input directly, or switch on editable diff panes to make changes while reviewing.
- Copy or clear either input, swap the two inputs, and paste from the clipboard.
- See line numbers, line and character counts, and addition/deletion statistics.
- Switch between light and dark themes; the theme preference is saved in the browser.
- Use the responsive interface on desktop and mobile.
- Read the built-in FAQ and blog.
- Keep comparisons on your device: text is processed in the browser and is not uploaded.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · `diff` · `parse-diff` · Vercel

## Getting started

Requirements: Node.js and npm.

```bash
git clone https://github.com/ujjwalraj123/diffviewer.git
cd diffviewer
npm install
npm run dev
```

Open the local URL printed by Vite (the development server is configured to use port `4319`).

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Generate the sitemap, type-check, and build the app to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run sitemap` | Generate `public/sitemap.xml` from the blog posts |

## Routes

- `/` — diff tool
- `/faq` — frequently asked questions
- `/blog` — blog index
- `/blog/:slug` — individual blog post

The app uses a small History API router in `src/lib/router.ts`. Vercel rewrites routes to `index.html`, allowing app routes to load directly.

## Project structure

```text
src/
  components/       App layout, sidebar, text editors, and reusable UI
  config/site.ts    Site URL and default SEO metadata
  content/          FAQ entries and blog posts
  hooks/            Clipboard, SEO, and theme hooks
  lib/              Router, diff utilities, and shared helpers
  pages/             Diff tool, FAQ, blog pages, and not-found page
  styles/            Global, app, and blog styles
scripts/
  generate-sitemap.mjs
public/              Static assets, robots.txt, and sitemap.xml
```

## Blog posts and sitemap

Add blog content to the `POSTS` array in `src/content/posts.ts`. Each post has a unique `slug`, title, description, publication date, estimated reading time, and sections. The sitemap generator reads post slugs and dates from this file and includes the tool, FAQ, blog index, and blog post URLs. It runs automatically before each production build; run `npm run sitemap` to regenerate it manually.

Page titles, descriptions, canonical URLs, Open Graph metadata, and structured data are set by the pages using `src/hooks/useSeo.ts`.

## Deployment

The project is configured for Vercel. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. `vercel.json` contains the SPA rewrite and response headers.

If deploying to a different domain, update the site URL in `src/config/site.ts`, `scripts/generate-sitemap.mjs`, `index.html`, `public/robots.txt`, and `public/sitemap.xml`.

## Privacy

The comparison is performed in your browser; the text you enter is not sent to the app's server for processing. As with any online tool, avoid entering secrets or sensitive personal data unless you are comfortable doing so.

## Contributing

1. Create a branch for your change.
2. Make and test your changes.
3. Run `npm run lint` and `npm run build`.
4. Open a pull request.
