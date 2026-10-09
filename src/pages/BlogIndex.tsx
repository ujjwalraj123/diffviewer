import { SiteHeader } from './SiteHeader'
import { Link } from '../components/Link'
import { POSTS } from '../content/posts'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'

export default function BlogIndex() {
  const { dark, toggle } = useTheme()
  useSeo({
    title: 'Blog – Diff Tips, Text & Code Comparison Guides | DiffViewer',
    description: 'Guides on comparing text, code, JSON and config files, and getting the most out of a diff checker.',
    path: '/blog',
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