import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useMonacoTheme } from '../hooks/useMonacoTheme'
import { CopyButton } from './CopyButton'

interface TextEditorPairProps {
  language: string
  left: string
  right: string
  onLeftChange: (v: string) => void
  onRightChange: (v: string) => void
  dark: boolean
}

const baseOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "'ui-monospace', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace",
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  automaticLayout: true,
  padding: { top: 10, bottom: 10 },
  renderOverviewRuler: false,
  scrollbar: { vertical: 'auto' as const, horizontal: 'auto' as const, useShadows: false },
  tabSize: 2,
}

export function TextEditorPair({
  language, left, right, onLeftChange, onRightChange, dark,
}: TextEditorPairProps) {
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
  useMonacoTheme(monacoRef.current, dark)

  const handleMount: OnMount = useCallback((_editor, monaco) => {
    monacoRef.current = monaco
  }, [])

  const theme = dark ? 'dv-dark' : 'dv-light'

  return (
    <div className="panes">
      <div className="pane">
        <div className="pane-header">
          <span>Original</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag">{left.length} ch</span>
            <CopyButton text={left} dark={dark} />
          </div>
        </div>
        <div className="pane-body">
          <Editor
            height="100%"
            language={language}
            value={left}
            onChange={(v) => onLeftChange(v ?? '')}
            theme={theme}
            onMount={handleMount}
            options={baseOptions}
          />
        </div>
      </div>

      <div className="pane-splitter" />

      <div className="pane">
        <div className="pane-header">
          <span>Modified</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag">{right.length} ch</span>
            <CopyButton text={right} dark={dark} />
          </div>
        </div>
        <div className="pane-body">
          <Editor
            height="100%"
            language={language}
            value={right}
            onChange={(v) => onRightChange(v ?? '')}
            theme={theme}
            onMount={handleMount}
            options={baseOptions}
          />
        </div>
      </div>
    </div>
  )
}