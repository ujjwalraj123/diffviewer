import { useState } from 'react'
import { Toolbar } from '../components/Toolbar'
import { TextEditorPair } from '../components/TextEditorPair'
import { DiffEditorPanel } from '../components/DiffEditorPanel'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { SITE } from '../config/site'

const SAMPLE_LEFT = `function greet(name) {
  return "Hello, " + name;
}

greet("world");
`

const SAMPLE_RIGHT = `function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

greet("world");
greet("there", "Hi");
`

const FAQS = [
  {
    q: 'Is this diff checker free?',
    a: 'Yes. DiffViewer is completely free to use with no sign-up, no limits on the number of comparisons, and no watermarks.',
  },
  {
    q: 'Is my data uploaded to a server?',
    a: 'No. The comparison runs entirely in your browser. Your text and code never leave your device, which makes DiffViewer safe for sensitive data such as config files and API responses.',
  },
  {
    q: 'What can I compare?',
    a: 'You can compare any two pieces of text or code, including JavaScript, TypeScript, JSON, HTML, CSS, Python, SQL, YAML and plain text, with line-level and word-level highlighting.',
  },
  {
    q: 'How do I read the diff highlights?',
    a: 'Red marks content removed from the original, green marks content added in the modified version, and untinted lines are unchanged. Word-level tints show the exact parts of a line that changed.',
  },
]

export default function ToolPage() {
  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [language, setLanguage] = useState('javascript')
  const [left, setLeft] = useState(SAMPLE_LEFT)
  const [right, setRight] = useState(SAMPLE_RIGHT)
  const { dark, toggle } = useTheme()

  useSeo({
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: SITE.name,
          url: SITE.url + '/',
          description: SITE.defaultDescription,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    },
  })

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        language={language}
        onLanguageChange={setLanguage}
        onClear={() => { setLeft(''); setRight('') }}
        dark={dark}
        onToggleDark={toggle}
      />
      {mode === 'edit' ? (
        <TextEditorPair
          language={language} left={left} right={right}
          onLeftChange={setLeft} onRightChange={setRight} dark={dark}
        />
      ) : (
        <DiffEditorPanel
          language={language} original={left} modified={right} dark={dark}
          onOriginalChange={setLeft} onModifiedChange={setRight}
        />
      )}

      <section className="seo-content" aria-label="About DiffViewer">
        <h1>Online Diff Checker – Compare Text &amp; Code Side by Side</h1>
        <p>
          DiffViewer is a free online diff checker that compares two pieces of text or code side
          by side with line-level and word-level highlighting. Paste your original text on the left
          and the updated version on the right to instantly see what was added, removed or changed.
          Everything runs entirely in your browser, so your data is never uploaded to a server —
          making it safe for comparing config files, JSON, API responses and other sensitive content.
        </p>
        <h2>Frequently asked questions</h2>
        <dl>
          {FAQS.map(f => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
        <p><a href="/blog">Read our guides on comparing text and code</a>.</p>
      </section>
    </div>
  )
}