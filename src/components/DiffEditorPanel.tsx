/**
 * DiffEditorPanel — lean orchestrator
 *
 * Responsibilities:
 *   • Mount the Monaco DiffEditor
 *   • Detect cursor position changes on both sides → resolve selected lines
 *   • Propagate edits made inside the diff editor back to App state
 *     (onOriginalChange / onModifiedChange) so the Edit panel stays in sync
 *   • Render SelectedLineRow panels + shared scrollbar
 *
 * All pure helpers live in src/lib/lineMapping.ts
 * The shared-scroll logic lives in src/hooks/useSharedScroll.ts
 * The panel UI lives in src/components/SelectedLineRow.tsx
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import type * as MonacoNS from 'monaco-editor'
import { useMonacoTheme } from '../hooks/useMonacoTheme'
import { useSharedScroll } from '../hooks/useSharedScroll'
import { mapOrigToMod, mapModToOrig, getLineText } from '../lib/lineMapping'
import { SelectedLineRow } from './SelectedLineRow'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiffEditorPanelProps {
  language: string
  original: string
  modified: string
  dark: boolean
  /** Called when the user edits the original side inside the diff editor */
  onOriginalChange: (value: string) => void
  /** Called when the user edits the modified side inside the diff editor */
  onModifiedChange: (value: string) => void
}

interface SelectedLines {
  origLine: number | null
  modLine:  number | null
  origText: string
  modText:  string
}

// ─── Editor options (stable reference — never recreated) ─────────────────────

const EDITOR_OPTIONS: MonacoNS.editor.IDiffEditorConstructionOptions = {
  renderSideBySide: true,
  readOnly: false,
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "'ui-monospace','SFMono-Regular','SF Mono',Menlo,Consolas,monospace",
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  diffWordWrap: 'off',
  automaticLayout: true,
  padding: { top: 10, bottom: 10 },
  renderOverviewRuler: false,
  scrollbar: { vertical: 'auto', horizontal: 'auto', useShadows: false },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiffEditorPanel({
  language,
  original,
  modified,
  dark,
  onOriginalChange,
  onModifiedChange,
}: DiffEditorPanelProps) {
  // ── Monaco refs ─────────────────────────────────────────────────────────────
  const monacoRef     = useRef<Parameters<DiffOnMount>[1] | null>(null)
  const diffEditorRef = useRef<MonacoNS.editor.IStandaloneDiffEditor | null>(null)

  // Keep latest callbacks in a ref so event listeners never go stale
  const onOriginalChangeRef = useRef(onOriginalChange)
  const onModifiedChangeRef = useRef(onModifiedChange)
  useEffect(() => { onOriginalChangeRef.current = onOriginalChange }, [onOriginalChange])
  useEffect(() => { onModifiedChangeRef.current = onModifiedChange }, [onModifiedChange])

  useMonacoTheme(monacoRef.current, dark)

  // ── Selected-line state ──────────────────────────────────────────────────────
  const [sel, setSel] = useState<SelectedLines>({
    origLine: null,
    modLine:  null,
    origText: '',
    modText:  '',
  })

  // ── Shared-scroll refs ───────────────────────────────────────────────────────
  const scrollbarRef = useRef<HTMLDivElement>(null)
  const origRowRef   = useRef<HTMLDivElement>(null)
  const modRowRef    = useRef<HTMLDivElement>(null)

  useSharedScroll(scrollbarRef, origRowRef, modRowRef, sel.origText, sel.modText)

  // ── Resolve selected lines from either side ──────────────────────────────────
  const resolveSelection = useCallback((
    side: 'original' | 'modified',
    lineNumber: number,
  ) => {
    const editor = diffEditorRef.current
    if (!editor) return

    const origModel = editor.getOriginalEditor().getModel()
    const modModel  = editor.getModifiedEditor().getModel()
    const changes   = editor.getLineChanges() ?? []

    let origLine: number | null
    let modLine:  number | null

    if (side === 'original') {
      origLine = lineNumber
      modLine  = mapOrigToMod(changes, lineNumber)
    } else {
      modLine  = lineNumber
      origLine = mapModToOrig(changes, lineNumber)
    }

    setSel({
      origLine,
      modLine,
      origText: getLineText(origModel, origLine),
      modText:  getLineText(modModel,  modLine),
    })

    // Reset shared scroll so both panels start at the left edge
    if (scrollbarRef.current) scrollbarRef.current.scrollLeft = 0
    if (origRowRef.current)   origRowRef.current.scrollLeft   = 0
    if (modRowRef.current)    modRowRef.current.scrollLeft    = 0
  }, [])

  // ── Mount: wire cursor listeners + model-change listeners ───────────────────
  const handleMount: DiffOnMount = useCallback((editor, monaco) => {
    monacoRef.current     = monaco
    diffEditorRef.current = editor

    const origEditor = editor.getOriginalEditor()
    const modEditor  = editor.getModifiedEditor()

    // Cursor → update selected-line panels
    origEditor.onDidChangeCursorPosition(e =>
      resolveSelection('original', e.position.lineNumber)
    )
    modEditor.onDidChangeCursorPosition(e =>
      resolveSelection('modified', e.position.lineNumber)
    )

    // Model content changes → propagate back to App so Edit panel stays in sync
    origEditor.onDidChangeModelContent(() => {
      const value = origEditor.getModel()?.getValue() ?? ''
      onOriginalChangeRef.current(value)
    })
    modEditor.onDidChangeModelContent(() => {
      const value = modEditor.getModel()?.getValue() ?? ''
      onModifiedChangeRef.current(value)
    })
  }, [resolveSelection])

  // ── Re-resolve selection when props change (e.g. Edit panel updated text) ───
  useEffect(() => {
    const editor = diffEditorRef.current
    if (!editor) return
    // Give Monaco 50 ms to recompute the diff after the model update
    const id = window.setTimeout(() => {
      const pos = editor.getOriginalEditor().getPosition()
      if (pos) resolveSelection('original', pos.lineNumber)
    }, 50)
    return () => window.clearTimeout(id)
  }, [original, modified, resolveSelection])

  const theme      = dark ? 'dv-dark' : 'dv-light'
  const borderClr  = dark ? '#30363D' : '#D8DCE3'

  return (
    <div className="panes">
      <div
        className="diff-full"
        style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {/* ── 1. Header ── */}
        <div className="pane-header">
          <span>Diff — Original ⇄ Modified</span>
          {sel.origLine !== null && (
            <span className="tag">line {sel.origLine}</span>
          )}
        </div>

        {/* ── 2. Main DiffEditor ── */}
        <div className="pane-body">
          <DiffEditor
            height="100%"
            language={language}
            original={original}
            modified={modified}
            theme={theme}
            onMount={handleMount}
            options={EDITOR_OPTIONS}
          />
        </div>

        {/* ── 3. Selected-line panels ── */}
        <SelectedLineRow
          label="Original"
          lineNo={sel.origLine}
          text={sel.origText}
          dark={dark}
          rowRef={origRowRef}
        />

        <SelectedLineRow
          label="Modified"
          lineNo={sel.modLine}
          text={sel.modText}
          dark={dark}
          rowRef={modRowRef}
        />

        {/* ── 4. ONE shared horizontal scrollbar ── */}
        <div
          ref={scrollbarRef}
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            borderTop: `1px solid ${borderClr}`,
            height: 14,
            flexShrink: 0,
          }}
        >
          {/* Phantom spacer — width set dynamically by useSharedScroll */}
          <div style={{ height: 1 }} />
        </div>
      </div>
    </div>
  )
}