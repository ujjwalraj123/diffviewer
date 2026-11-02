import { createElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'node:stream'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const root = process.cwd()
const dist = resolve(root, 'dist')
const vite = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const [{ default: App }, { SITE }, { POSTS }] = await Promise.all([
    vite.ssrLoadModule('/src/App.tsx'),
    vite.ssrLoadModule('/src/config/site.ts'),
    vite.ssrLoadModule('/src/content/posts.ts'),
  ])
  const template = await readFile(resolve(dist, 'index.html'), 'utf8')
  const routes = [
    '/',
    '/json-formatter',
    '/faq',
    '/blog',
    ...POSTS.map((post) => `/blog/${post.slug}`),
  ]

  for (const route of routes) {
    let seo
    globalThis.__DIFFVIEWER_SSR_PATH__ = route
    globalThis.__DIFFVIEWER_SSR_SEO__ = (props) => {
      seo = props
    }

    const markup = await render(createElement(App))
    if (!seo) throw new Error(`No SEO metadata was collected for ${route}`)

    const output = route === '/'
      ? resolve(dist, 'index.html')
      : resolve(dist, route.slice(1), 'index.html')
    const html = applySeo(template, seo, SITE.url, markup)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, html)
    console.log(`[prerender] ${route}`)
  }
} finally {
  delete globalThis.__DIFFVIEWER_SSR_PATH__
  delete globalThis.__DIFFVIEWER_SSR_SEO__
  await vite.close()
}

function render(element) {
  return new Promise((resolvePromise, rejectPromise) => {
    const output = new PassThrough()
    const chunks = []
    let stream
    let renderError

    output.on('data', (chunk) => chunks.push(chunk))
    output.on('error', rejectPromise)
    output.on('end', () => {
      if (renderError) {
        rejectPromise(renderError)
        return
      }
      resolvePromise(Buffer.concat(chunks).toString('utf8'))
    })

    stream = renderToPipeableStream(element, {
      onAllReady() {
        stream.pipe(output)
      },
      onShellError(error) {
        rejectPromise(error)
      },
      onError(error) {
        renderError ??= error
      },
    })
  })
}

function applySeo(template, seo, siteUrl, markup) {
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Could not find the app root in the production HTML template')
  }
  const canonical = new URL(seo.path, siteUrl).href
  const image = new URL(seo.image ?? '/og-image.svg', siteUrl).href
  const imageAlt = seo.imageAlt ?? 'DiffViewer – online diff checker comparing text side by side'
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/i, meta('name', 'description', seo.description))
    .replace(/<meta\s+name="robots"[^>]*>/i, meta('name', 'robots', seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'))
    .replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta\s+property="og:type"[^>]*>/i, meta('property', 'og:type', seo.type ?? 'website'))
    .replace(/<meta\s+property="og:title"[^>]*>/i, meta('property', 'og:title', seo.title))
    .replace(/<meta\s+property="og:description"[^>]*>/i, meta('property', 'og:description', seo.description))
    .replace(/<meta\s+property="og:url"[^>]*>/i, meta('property', 'og:url', canonical))
    .replace(/<meta\s+property="og:image"[^>]*>/i, meta('property', 'og:image', image))
    .replace(/<meta\s+property="og:image:alt"[^>]*>/i, meta('property', 'og:image:alt', imageAlt))
    .replace(/<meta\s+name="twitter:title"[^>]*>/i, meta('name', 'twitter:title', seo.title))
    .replace(/<meta\s+name="twitter:description"[^>]*>/i, meta('name', 'twitter:description', seo.description))
    .replace(/<meta\s+name="twitter:image"[^>]*>/i, meta('name', 'twitter:image', image))
    .replace(/<meta\s+name="twitter:image:alt"[^>]*>/i, meta('name', 'twitter:image:alt', imageAlt))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, structuredData(seo.jsonLd))
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
  return html
}

function meta(attribute, key, value) {
  return `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`
}

function structuredData(data) {
  if (!data) return ''
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
