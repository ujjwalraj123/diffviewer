import { SiteHeader } from './SiteHeader'
import { Link } from '../components/Link'
import { POSTS } from '../content/posts'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'

export default function BlogIndex() {
  const { dark, toggle } = useTheme()
  useSeo({
    title: 'Blog – Diff Tips, Text & Code Comparison Guides | DiffViewer',
    description: 'Guides on comparing text, code, JSON and config files, and getting the most out of a diff checker.',
    path: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Blog',
          name: 'DiffViewer Blog',
          url: SITE.url + '/blog',
          description: 'Guides on comparing text, code, JSON and config files, and getting the most out of a diff checker.',
          blogPost: POSTS.map(p => ({
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.description,
            datePublished: p.date,
            url: SITE.url + '/blog/' + p.slug,
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE.url + '/blog' },
          ],
        },
      ],
    },
  })

  return (
    <>
      <SiteHeader dark={dark} onToggleDark={toggle} />
      <main className="page">
        <h1>Blog</h1>
        <p className="lead">Short, practical guides on comparing text and code.</p>
        <div className="cards">
          {POSTS.map(p => (
            <article key={p.slug} className="card">
              <h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
              <p>{p.description}</p>
              <small>
                <time dateTime={p.date}>{p.date}</time> · {p.readMins} min read
              </small>
            </article>
          ))}
        </div>
      </main>
    </>
  )
}