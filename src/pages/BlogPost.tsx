import { AppLayout } from '../components/AppLayout'
import { Link } from '../components/Link'
import { SITE } from '../config/site'
import { POSTS, type Post } from '../content/posts'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { Clock, ChevronRight, GitCompare } from 'lucide-react'

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

  const more = POSTS.filter((p) => p.slug !== post.slug)

  return (
    <AppLayout dark={dark} onToggleDark={toggle}>
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 flex-1">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <Link to="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header */}
        <article className="space-y-6">
          <div className="space-y-3 border-b border-border pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <time dateTime={post.date}>{post.date}</time>
              <span>·</span>
              <span>{post.readMins} min read</span>
            </div>
          </div>

          {/* Article Sections */}
          <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
            {post.sections.map((s) => (
              <section key={s.heading} className="space-y-2.5">
                <h2 className="text-xl font-semibold text-foreground tracking-tight pt-2">
                  {s.heading}
                </h2>
                {s.body.map((t, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {t}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>

        {/* CTA Card */}
        <aside className="p-6 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              Ready to compare your files?
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste your text or code into our free browser diff checker.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs shrink-0"
          >
            <GitCompare className="size-3.5" />
            <span>Open Diff Tool</span>
          </Link>
        </aside>

        {/* More Articles */}
        {more.length > 0 && (
          <section className="border-t border-border pt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">More Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {more.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="p-3.5 rounded-lg border border-border/70 bg-card hover:border-primary/50 transition-colors block text-xs space-y-1 group"
                >
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.readMins} min read
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppLayout>
  )
}