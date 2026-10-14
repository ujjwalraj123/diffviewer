import { AppLayout } from '../components/AppLayout'
import { Link } from '../components/Link'
import { POSTS } from '../content/posts'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

export default function BlogIndex() {
  const { dark, toggle } = useTheme()
  useSeo({
    title: 'Blog – Diff Tips, Text & Code Comparison Guides | DiffViewer',
    description:
      'Guides on comparing text, code, JSON and config files, and getting the most out of a diff checker.',
    path: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Blog',
          name: 'DiffViewer Blog',
          url: SITE.url + '/blog',
          description:
            'Guides on comparing text, code, JSON and config files, and getting the most out of a diff checker.',
          blogPost: POSTS.map((p) => ({
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
    <AppLayout dark={dark} onToggleDark={toggle}>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 flex-1">
        <div className="space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <BookOpen className="size-4" />
            <span>Guides &amp; Articles</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Short, practical guides on comparing text, code, JSON, and configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POSTS.map((p) => (
            <article
              key={p.slug}
              className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <time dateTime={p.date}>{p.date}</time>
                  <span>·</span>
                  <span>{p.readMins} min read</span>
                </div>
                <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                </h2>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 flex items-center text-xs font-medium text-primary gap-1">
                <Link to={`/blog/${p.slug}`} className="inline-flex items-center gap-1 group-hover:underline">
                  <span>Read article</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </AppLayout>
  )
}