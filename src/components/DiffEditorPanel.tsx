import { useRef, useCallback } from 'react'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import { useMonacoTheme } from '../hooks/useMonacoTheme'

interface DiffEditorPanelProps {
  language: string
  original: string
  modified: string
}

export function DiffEditorPanel({
  language, original, modified,
}: DiffEditorPanelProps) {
  const monacoRef = useRef<Parameters<DiffOnMount>[1] | null>(null)
  useMonacoTheme(monacoRef.current)

  const handleMount: DiffOnMount = useCallback((_editor, monaco) => {
    monacoRef.current = monaco
    monaco.editor.setTheme('csv-viewer-light')
  }, [])

  return (
    <div className="panes">
      <div className="diff-full" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="pane-header">
          <span>Diff — Original ⇄ Modified</span>
        </div>
        <div className="pane-body">
          <DiffEditor
            height="100%"
            language={language}
            original={original}
            modified={modified}
            theme="csv-viewer-light"
            onMount={handleMount}
            options={{
              renderSideBySide: true,
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'ui-monospace', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              renderOverviewRuler: false,
              scrollbar: { vertical: 'auto', horizontal: 'auto', useShadows: false },
            }}
          />
        </div>
      </div>
    </div>
  )
}