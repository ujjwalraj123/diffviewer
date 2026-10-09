import { SiteHeader } from './SiteHeader'
import { Link } from '../components/Link'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'

export default function NotFound() {
  const { dark, toggle } = useTheme()
  useSeo({ title: 'Page not found | DiffViewer', description: 'This page does not exist.', path: '/404', noindex: true })
  return (
    <>
      <SiteHeader dark={dark} onToggleDark={toggle} />
      <main className="page">
        <h1>Page not found</h1>
        <p><Link to="/">Go to the diff tool</Link> or <Link to="/blog">read the blog</Link>.</p>
      </main>
    </>
  )
}