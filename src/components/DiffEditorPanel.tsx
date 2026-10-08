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
import { CopyButton } from './CopyButton'

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

  // Guard: set to true while we are programmatically editing the model from
  // the bottom panels so onDidChangeModelContent doesn't double-fire.
  const suppressModelChangeRef = useRef(false)

  useMonacoTheme(monacoRef.current, dark)

  // ── Selected-line state ──────────────────────────────────────────────────────
  const [sel, setSel] = useState<SelectedLines>({
    origLine: null,
    modLine:  null,
    origText: '',
    modText:  '',
  })

  // ── Shared-scroll refs ───────────────────────────────────────────────────────
  const scrollbarRef      = useRef<HTMLDivElement>(null)
  const origTextareaRef   = useRef<HTMLTextAreaElement>(null)
  const modTextareaRef    = useRef<HTMLTextAreaElement>(null)

  useSharedScroll(scrollbarRef, origTextareaRef, modTextareaRef, sel.origText, sel.modText)

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
    if (scrollbarRef.current)    scrollbarRef.current.scrollLeft    = 0
    if (origTextareaRef.current) origTextareaRef.current.scrollLeft = 0
    if (modTextareaRef.current)  modTextareaRef.current.scrollLeft  = 0
  }, [])

  // ── Mount: wire cursor listeners + model-change listeners ───────────────────
  const handleMount: DiffOnMount = useCallback((editor, monaco) => {
    monacoRef.current     = monaco
    diffEditorRef.current = editor

    const origEditor = editor.getOriginalEditor()
    const modEditor  = editor.getModifiedEditor()

    // Make the original side editable — @monaco-editor/react doesn't expose
    // this as a prop, so we set it directly on the underlying editor instance.
    origEditor.updateOptions({ readOnly: false })

    // Cursor → update selected-line panels
    origEditor.onDidChangeCursorPosition(e =>
      resolveSelection('original', e.position.lineNumber)
    )
    modEditor.onDidChangeCursorPosition(e =>
      resolveSelection('modified', e.position.lineNumber)
    )

    // Model content changes → propagate back to App so Edit panel stays in sync.
    // Skip when the change was triggered by our own pushEditOperations call
    // (suppressModelChangeRef is set true around those calls).
    origEditor.onDidChangeModelContent(() => {
      if (suppressModelChangeRef.current) return
      const value = origEditor.getModel()?.getValue() ?? ''
      onOriginalChangeRef.current(value)
    })
    modEditor.onDidChangeModelContent(() => {
      if (suppressModelChangeRef.current) return
      const value = modEditor.getModel()?.getValue() ?? ''
      onModifiedChangeRef.current(value)
    })
  }, [resolveSelection])

  // ── Push external prop changes into the model imperatively ─────────────────
  // This is the fix for Bug 2 (cursor jumps to start).
  //
  // Passing `original` and `modified` as controlled props to <DiffEditor>
  // causes Monaco to reset the entire model on every keystroke (because
  // onDidChangeModelContent → App state update → prop change → Monaco reset).
  // Instead we keep the DiffEditor uncontrolled after mount and only push
  // changes that genuinely came from *outside* (e.g. the Edit panel).
  //
  // We track what value we last pushed so we don't re-push our own echoes.
  const lastPushedOrigRef = useRef(original)
  const lastPushedModRef  = useRef(modified)

  useEffect(() => {
    const editor = diffEditorRef.current
    if (!editor) return

    const origModel = editor.getOriginalEditor().getModel()
    const modModel  = editor.getModifiedEditor().getModel()

    // Only update the model when the incoming prop differs from what we last
    // pushed — i.e. the change came from outside (Edit panel), not from us.
    if (origModel && original !== lastPushedOrigRef.current) {
      lastPushedOrigRef.current = original
      suppressModelChangeRef.current = true
      origModel.pushEditOperations([], [{
        range: origModel.getFullModelRange(),
        text: original,
      }], () => null)
      suppressModelChangeRef.current = false
    }

    if (modModel && modified !== lastPushedModRef.current) {
      lastPushedModRef.current = modified
      suppressModelChangeRef.current = true
      modModel.pushEditOperations([], [{
        range: modModel.getFullModelRange(),
        text: modified,
      }], () => null)
      suppressModelChangeRef.current = false
    }

    // Re-resolve the selected line after external content change
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {sel.origLine !== null && (
              <span className="tag">line {sel.origLine}</span>
            )}
            <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              orig <CopyButton text={original} dark={dark} />
            </span>
            <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              mod <CopyButton text={modified} dark={dark} />
            </span>
          </div>
        </div>

        {/* ── 2. Main DiffEditor ── */}
        {/* original/modified are passed only as initial values (uncontrolled).
            External changes are pushed imperatively in the useEffect above.
            This prevents Monaco from resetting the cursor on every keystroke. */}
        <div className="pane-body">
          <DiffEditor
            height="100%"
            language={language}
            original={original}
            modified={modified}
            keepCurrentOriginalModel={true}
            keepCurrentModifiedModel={true}
            theme={theme}
            onMount={handleMount}
            options={EDITOR_OPTIONS}
          />
        </div>

        {/* ── 3. Selected-line panels ── */}
        <SelectedLineRow
          label="Original"
          side="original"
          lineNo={sel.origLine}
          text={sel.origText}
          peerText={sel.modText}
          dark={dark}
          textareaRef={origTextareaRef}
          onChange={(val) => {
            const editor = diffEditorRef.current
            const lineNo = sel.origLine
            if (editor && lineNo !== null) {
              const model = editor.getOriginalEditor().getModel()
              if (model) {
                const range = {
                  startLineNumber: lineNo,
                  startColumn: 1,
                  endLineNumber: lineNo,
                  endColumn: model.getLineMaxColumn(lineNo),
                }
                suppressModelChangeRef.current = true
                model.pushEditOperations([], [{ range, text: val }], () => null)
                suppressModelChangeRef.current = false
                onOriginalChangeRef.current(model.getValue())
              }
            }
            setSel(s => ({ ...s, origText: val }))
          }}
        />

        <SelectedLineRow
          label="Modified"
          side="modified"
          lineNo={sel.modLine}
          text={sel.modText}
          peerText={sel.origText}
          dark={dark}
          textareaRef={modTextareaRef}
          onChange={(val) => {
            const editor = diffEditorRef.current
            const lineNo = sel.modLine
            if (editor && lineNo !== null) {
              const model = editor.getModifiedEditor().getModel()
              if (model) {
                const range = {
                  startLineNumber: lineNo,
                  startColumn: 1,
                  endLineNumber: lineNo,
                  endColumn: model.getLineMaxColumn(lineNo),
                }
                suppressModelChangeRef.current = true
                model.pushEditOperations([], [{ range, text: val }], () => null)
                suppressModelChangeRef.current = false
                onModifiedChangeRef.current(model.getValue())
              }
            }
            setSel(s => ({ ...s, modText: val }))
          }}
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