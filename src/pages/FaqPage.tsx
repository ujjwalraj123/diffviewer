import { AppLayout } from '../components/AppLayout'
import { Link } from '../components/Link'
import { FAQS } from '../content/faqs'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { HelpCircle, GitCompare, ChevronRight } from 'lucide-react'

export default function FaqPage() {
  const { dark, toggle } = useTheme()

  useSeo({
    title: 'Frequently Asked Questions | DiffViewer',
    description:
      'Frequently asked questions about DiffViewer: our free, client-side diff checker with character-level accuracy.',
    path: '/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
            { '@type': 'ListItem', position: 2, name: 'FAQ', item: SITE.url + '/faq' },
          ],
        },
      ],
    },
  })

  const handleOpenDiff = () => {
    try {
      localStorage.setItem('dv_has_entered_diff', 'true')
    } catch {
      /* ignore */
    }
  }

  return (
    <AppLayout dark={dark} onToggleDark={toggle}>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" onClick={handleOpenDiff} className="hover:text-foreground transition-colors">
            Diff Tool
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground font-medium">FAQ</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <HelpCircle className="size-4" />
            <span>Support &amp; Answers</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about comparing text and code with DiffViewer.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-2xs space-y-2"
            >
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {f.q}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <aside className="p-6 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              Ready to compare your files?
            </h3>
            <p className="text-xs text-muted-foreground">
              Experience fast, private, character-accurate diffing right in your browser.
            </p>
          </div>
          <Link
            to="/"
            onClick={handleOpenDiff}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <GitCompare className="size-3.5" />
            <span>Open Diff Tool</span>
          </Link>
        </aside>
      </main>
    </AppLayout>
  )
}
