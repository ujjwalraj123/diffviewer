import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useMonacoTheme } from '../hooks/useMonacoTheme'

interface TextEditorPairProps {
  language: string
  left: string
  right: string
  onLeftChange: (v: string) => void
  onRightChange: (v: string) => void
}

const baseOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "'ui-monospace', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace",
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  renderOverviewRuler: false,
  scrollbar: { vertical: 'auto' as const, horizontal: 'auto' as const, useShadows: false },
  tabSize: 2,
}

export function TextEditorPair({
  language, left, right, onLeftChange, onRightChange,
}: TextEditorPairProps) {
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
  useMonacoTheme(monacoRef.current)

  const handleMount: OnMount = useCallback((_editor, monaco) => {
    monacoRef.current = monaco
    monaco.editor.setTheme('csv-viewer-light')
  }, [])

  return (
    <div className="panes">
      <div className="pane">
        <div className="pane-header">
          <span>Original</span>
          <span className="tag">{left.length} chars</span>
        </div>
        <div className="pane-body">
          <Editor
            height="100%"
            language={language}
            value={left}
            onChange={(v) => onLeftChange(v ?? '')}
            theme="csv-viewer-light"
            onMount={handleMount}
            options={baseOptions}
          />
        </div>
      </div>

      <div className="pane-splitter" />

      <div className="pane">
        <div className="pane-header">
          <span>Modified</span>
          <span className="tag">{right.length} chars</span>
        </div>
        <div className="pane-body">
          <Editor
            height="100%"
            language={language}
            value={right}
            onChange={(v) => onRightChange(v ?? '')}
            theme="csv-viewer-light"
            onMount={handleMount}
            options={baseOptions}
          />
        </div>
      </div>
    </div>
  )
}