import { Link } from '../components/Link'

export function SiteHeader({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  return (
    <header className="toolbar">
      <Link to="/" className="mark site-logo">DiffViewer</Link>
      <div className="spacer" />
      <nav className="site-nav" aria-label="Main">
        <Link to="/" className="btn">Diff Tool</Link>
        <Link to="/blog" className="btn">Blog</Link>
        <button className="btn" onClick={onToggleDark} aria-label="Toggle theme">
          {dark ? 'Light' : 'Dark'}
        </button>
      </nav>
    </header>
  )
}