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

      <div className="divider" />

      {/* Dark / light toggle */}
      <label className="theme-toggle" title={dark ? 'Switch to light' : 'Switch to dark'}>
        <span className="toggle-icon">{dark ? '🌙' : '☀️'}</span>
        <input type="checkbox" checked={dark} onChange={onToggleDark} />
        <div className="toggle-track">
          <div className="toggle-knob" />
        </div>
      </label>
    </div>
  )
}