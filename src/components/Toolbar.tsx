interface ToolbarProps {
  mode: 'edit' | 'diff'
  onModeChange: (mode: 'edit' | 'diff') => void
  language: string
  onLanguageChange: (lang: string) => void
  onClear: () => void
  dark: boolean
  onToggleDark: () => void
}

const LANGS = [
  'plaintext', 'javascript', 'typescript', 'json', 'html', 'css',
  'markdown', 'python', 'rust', 'go', 'java', 'csharp', 'sql', 'yaml', 'xml',
]

export function Toolbar({
  mode, onModeChange, language, onLanguageChange, onClear, dark, onToggleDark,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span className="toolbar-label">DiffViewer</span>
      </div>

      <div className="divider" />

      <div className="seg" role="tablist" aria-label="Mode">
        <button
          className={`btn ${mode === 'edit' ? 'active' : ''}`}
          onClick={() => onModeChange('edit')}
        >
          Edit
        </button>
        <button
          className={`btn ${mode === 'diff' ? 'active' : ''}`}
          onClick={() => onModeChange('diff')}
        >
          Diff
        </button>
      </div>

      <div className="divider" />

      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Language"
        style={{
          fontFamily: 'var(--ui)',
          fontSize: 12,
          padding: '4px 6px',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'var(--canvas)',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <div className="spacer" />

      <button className="btn" onClick={onClear}>Clear</button>

      {/* Theme toggle — icon-only button */}
      <button
        className="btn"
        onClick={onToggleDark}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ padding: '5px 7px' }}
      >
        {dark ? (
          // Sun icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1"  x2="12" y2="3"  />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"   />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1"  y1="12" x2="3"  y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"  />
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
          </svg>
        ) : (
          // Moon icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  )
}