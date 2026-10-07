interface ToolbarProps {
  mode: 'edit' | 'diff'
  onModeChange: (mode: 'edit' | 'diff') => void
  language: string
  onLanguageChange: (lang: string) => void
  onClear: () => void
}

const LANGS = [
  'plaintext', 'javascript', 'typescript', 'json', 'html', 'css',
  'markdown', 'python', 'rust', 'go', 'java', 'sql', 'yaml', 'xml',
]

export function Toolbar({
  mode, onModeChange, language, onLanguageChange, onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span>DiffViewer</span>
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

      <label className="mark" style={{ fontWeight: 500, color: 'var(--muted)' }}>
        Language
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            fontFamily: 'var(--ui)',
            fontSize: 13,
            padding: '5px 8px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'var(--canvas)',
            color: 'var(--ink)',
          }}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>

      <div className="spacer" />

      <button className="btn" onClick={onClear}>Clear</button>
    </div>
  )
}