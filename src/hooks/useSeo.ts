import { useEffect } from 'react'
import { SITE } from '../config/site'

interface SeoProps {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: object
  image?: string
  imageAlt?: string
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSeo({ title, description, path, type = 'website', noindex, jsonLd, image, imageAlt }: SeoProps) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    const url = SITE.url + (path === '/' ? '/' : path)
    const imageUrl = SITE.url + (image ?? SITE.image)
    const alt = imageAlt ?? SITE.imageAlt
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:alt', alt)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('name', 'twitter:image:alt', alt)

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url

    const id = 'page-jsonld'
    document.getElementById(id)?.remove()
    if (ld) {
      const s = document.createElement('script')
      s.id = id
      s.type = 'application/ld+json'
      s.text = ld
      document.head.appendChild(s)
    }
  }, [title, description, path, type, noindex, ld, image, imageAlt])
}