import { AppLayout } from '../components/AppLayout'
import { Link } from '../components/Link'
import { ToolSwitcher } from '../components/ToolSwitcher'
import { FAQS, JSON_FAQS } from '../content/faqs'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { HelpCircle, ChevronRight } from 'lucide-react'

export default function FaqPage() {
  const { dark, toggle } = useTheme()

  useSeo({
    title: 'Frequently Asked Questions | DiffViewer',
    description:
      'Frequently asked questions about DiffViewer and its online JSON formatter, validator, and diff checker.',
    path: '/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: [...FAQS, ...JSON_FAQS].map((f) => ({
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

  return (
    <AppLayout dark={dark} onToggleDark={toggle}>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">
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

        {[
          { title: 'Diff Viewer FAQs', items: FAQS },
          { title: 'JSON Formatter FAQs', items: JSON_FAQS },
        ].map(({ title, items }) => (
          <section key={title} aria-label={title} className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((f) => (
                <div
                  key={f.q}
                  className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-2xs space-y-2"
                >
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    {f.q}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA Card */}
        <aside className="p-6 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              Ready to get started?
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose a tool to compare text or format JSON, right in your browser.
            </p>
          </div>
          <ToolSwitcher currentTool="diff" />
        </aside>
      </main>
    </AppLayout>
  )
}
