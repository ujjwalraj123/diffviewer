import { SiteHeader } from './SiteHeader'
import { Link } from '../components/Link'
import { SITE } from '../config/site'
import { POSTS, type Post } from '../content/posts'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'

export default function BlogPost({ post }: { post: Post }) {
  const { dark, toggle } = useTheme()
  const path = `/blog/${post.slug}`

  useSeo({
    title: `${post.title} | DiffViewer`,
    description: post.description,
    path,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          image: SITE.url + SITE.image,
          mainEntityOfPage: SITE.url + path,
          wordCount: post.sections.reduce((n, s) => n + s.body.join(' ').split(/\s+/).length, 0),
          author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          publisher: {
            '@type': 'Organization',
            name: SITE.name,
            url: SITE.url,
            logo: { '@type': 'ImageObject', url: SITE.url + SITE.image },
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE.url + '/blog' },
            { '@type': 'ListItem', position: 3, name: post.title, item: SITE.url + path },
          ],
        },
      ],
    },
  })

  const more = POSTS.filter(p => p.slug !== post.slug)

  return (
    <>
      <SiteHeader dark={dark} onToggleDark={toggle} />
      <main className="page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to="/blog">Blog</Link>
        </nav>
        <article>
          <h1>{post.title}</h1>
          <p className="meta">
            <time dateTime={post.date}>{post.date}</time> · {post.readMins} min read
          </p>
          {post.sections.map(s => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((t, i) => <p key={i}>{t}</p>)}
            </section>
          ))}
        </article>

        <aside className="cta">
          <p>Try it now: paste two texts and see the differences instantly.</p>
          <Link to="/" className="btn active">Open the diff tool</Link>
        </aside>

        {more.length > 0 && (
          <section>
            <h2>More guides</h2>
            <ul className="more">
              {more.map(p => (
                <li key={p.slug}><Link to={`/blog/${p.slug}`}>{p.title}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  )
}