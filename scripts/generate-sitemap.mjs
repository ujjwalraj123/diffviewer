// Generates public/sitemap.xml from the posts defined in src/content/posts.ts.
// Run automatically before every build (see package.json "prebuild").
// Kept dependency-free: posts.ts is parsed with regexes rather than imported,
// so this works without a TS loader.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const SITE_URL = 'https://diffviewer-weld.vercel.app'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const postsFile = resolve(root, 'src/content/posts.ts')
const outFile = resolve(root, 'public/sitemap.xml')

const src = readFileSync(postsFile, 'utf8')

// Extract each post's slug and date from the POSTS array.
const slugRe = /slug:\s*'([^']+)'/g
const dateRe = /date:\s*'([^']+)'/g

const slugs = [...src.matchAll(slugRe)].map(m => m[1])
const dates = [...src.matchAll(dateRe)].map(m => m[1])

if (slugs.length === 0) {
  console.warn('[sitemap] No posts found in posts.ts — generating tool + blog URLs only.')
}

const today = new Date().toISOString().slice(0, 10)

const urls = [
  { loc: `${SITE_URL}/`, lastmod: today },
  { loc: `${SITE_URL}/blog`, lastmod: today },
  ...slugs.map((slug, i) => ({
    loc: `${SITE_URL}/blog/${slug}`,
    lastmod: dates[i] ?? today,
  })),
]

const body = urls
  .map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

writeFileSync(outFile, xml)
console.log(`[sitemap] Wrote ${urls.length} URLs to ${outFile}`)
