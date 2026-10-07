/**
 * DiffEditorPanel
 *
 * Layout (top → bottom):
 *   1. Main Monaco DiffEditor  (side-by-side, no word-wrap)
 *   2. Selected-line panel — Original
 *   3. Selected-line panel — Modified
 *   4. ONE shared horizontal scrollbar that drives both panels
 *
 * Line mapping uses Monaco's own diff engine (getLineChanges) so that
 * insertions / deletions are handled correctly — no external diff lib needed.
 */

import {
  useRef,
  useCallback,
  useState,
  useEffect,
  type CSSProperties,
} from 'react'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import type * as MonacoNS from 'monaco-editor'
import { useMonacoTheme } from '../hooks/useMonacoTheme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiffEditorPanelProps {
  language: string
  original: string
  modified: string
  dark: boolean
}

interface SelectedLines {
  origLine: number | null   // 1-based, null = deleted / no mapping
  modLine:  number | null   // 1-based, null = inserted / no mapping
  origText: string
  modText:  string
}

// ─── Line-mapping helpers ─────────────────────────────────────────────────────

/**
 * Given Monaco's LineChanges and a clicked line number on one side,
 * return the best-effort corresponding line number on the other side.
 *
 * Strategy (mirrors Beyond Compare):
 *   - If the line falls inside a change range, map to the start of the
 *     corresponding range on the other side (or null if that range is empty).
 *   - If the line is outside all change ranges, apply the cumulative offset
 *     accumulated by all preceding changes.
 */
function mapOrigToMod(
  changes: MonacoNS.editor.ILineChange[],
  origLine: number,
): number | null {
  let offset = 0

  for (const c of changes) {
    const oStart = c.originalStartLineNumber
    const oEnd   = c.originalEndLineNumber   // 0 means pure insertion
    const mStart = c.modifiedStartLineNumber
    const mEnd   = c.modifiedEndLineNumber   // 0 means pure deletion

    if (oEnd > 0 && origLine >= oStart && origLine <= oEnd) {
      // Line is inside a changed original range
      if (mEnd === 0) return null // pure deletion — no modified counterpart
      // Map proportionally within the range, clamped to mEnd
      const ratio = (origLine - oStart) / Math.max(oEnd - oStart, 1)
      return Math.min(mStart + Math.round(ratio * (mEnd - mStart)), mEnd)
    }

    if (origLine > (oEnd > 0 ? oEnd : oStart - 1)) {
      // This change is entirely before our line — accumulate offset
      const origLen = oEnd > 0 ? oEnd - oStart + 1 : 0
      const modLen  = mEnd > 0 ? mEnd - mStart + 1 : 0
      offset += modLen - origLen
    }
  }

  // Unchanged line — apply accumulated offset
  return origLine + offset
}

function mapModToOrig(
  changes: MonacoNS.editor.ILineChange[],
  modLine: number,
): number | null {
  let offset = 0

  for (const c of changes) {
    const oStart = c.originalStartLineNumber
    const oEnd   = c.originalEndLineNumber
    const mStart = c.modifiedStartLineNumber
    const mEnd   = c.modifiedEndLineNumber

    if (mEnd > 0 && modLine >= mStart && modLine <= mEnd) {
      if (oEnd === 0) return null // pure insertion — no original counterpart
      const ratio = (modLine - mStart) / Math.max(mEnd - mStart, 1)
      return Math.min(oStart + Math.round(ratio * (oEnd - oStart)), oEnd)
    }

    if (modLine > (mEnd > 0 ? mEnd : mStart - 1)) {
      const origLen = oEnd > 0 ? oEnd - oStart + 1 : 0
      const modLen  = mEnd > 0 ? mEnd - mStart + 1 : 0
      offset += origLen - modLen
    }
  }

  return modLine + offset
}

function getLineText(
  model: MonacoNS.editor.ITextModel | null,
  line: number | null,
): string {
  if (!model || line === null) return ''
  if (line < 1 || line > model.getLineCount()) return ''
  return model.getLineContent(line)
}

// ─── Shared-scroll hook ───────────────────────────────────────────────────────

/**
 * Synchronises the scrollLeft of an inner "content" div with a single
 * external scrollbar div.  The scrollbar div is sized by a phantom spacer
 * whose width equals the max content width of both lines.
 */
function useSharedScroll(
  scrollbarRef: React.RefObject<HTMLDivElement | null>,
  origRowRef:   React.RefObject<HTMLDivElement | null>,
  modRowRef:    React.RefObject<HTMLDivElement | null>,
  origText: string,
  modText:  string,
) {
  // Recompute phantom width whenever text changes
  useEffect(() => {
    const bar     = scrollbarRef.current
    const origRow = origRowRef.current
    const modRow  = modRowRef.current
    if (!bar || !origRow || !modRow) return

    // The phantom spacer is the first child of the scrollbar div
    const spacer = bar.firstElementChild as HTMLElement | null
    if (!spacer) return

    const w = Math.max(origRow.scrollWidth, modRow.scrollWidth)
    spacer.style.width = `${w}px`
  }, [origText, modText, scrollbarRef, origRowRef, modRowRef])

  // Wire scroll events: scrollbar → rows
  useEffect(() => {
    const bar = scrollbarRef.current
    if (!bar) return

    const onScroll = () => {
      const sl = bar.scrollLeft
      if (origRowRef.current) origRowRef.current.scrollLeft = sl
      if (modRowRef.current)  modRowRef.current.scrollLeft  = sl
    }

    bar.addEventListener('scroll', onScroll, { passive: true })
    return () => bar.removeEventListener('scroll', onScroll)
  }, [scrollbarRef, origRowRef, modRowRef])
}

// ─── SelectedLineRow ──────────────────────────────────────────────────────────

interface SelectedLineRowProps {
  label: string
  lineNo: number | null
  text: string
  dark: boolean
  rowRef: React.RefObject<HTMLDivElement | null>
  style?: CSSProperties
}

const MONO: CSSProperties = {
  fontFamily: "'ui-monospace','SFMono-Regular','SF Mono',Menlo,Consolas,monospace",
  fontSize: 13,
  lineHeight: '22px',
  whiteSpace: 'pre',
  overflow: 'hidden',   // scrolling is driven by the shared scrollbar only
}

function SelectedLineRow({ label, lineNo, text, dark, rowRef, style }: SelectedLineRowProps) {
  const headerBg  = dark ? '#161B22' : '#F4F6FA'
  const headerClr = dark ? '#8B949E' : '#6B7280'
  const bodyBg    = dark ? '#0D1117' : '#FFFFFF'
  const inkClr    = dark ? '#E6EDF3' : '#16181D'
  const numClr    = dark ? '#484F58' : '#9CA3AF'
  const borderClr = dark ? '#30363D' : '#D8DCE3'

  return (
    <div style={{ borderTop: `1px solid ${borderClr}`, ...style }}>
      {/* Sub-header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        background: headerBg,
        borderBottom: `1px solid ${borderClr}`,
        fontSize: 11,
        fontWeight: 600,
        color: headerClr,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        {label}
        {lineNo !== null && (
          <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            — Line {lineNo}
          </span>
        )}
        {lineNo === null && (
          <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>
            — (no corresponding line)
          </span>
        )}
      </div>

      {/* Content row — overflow hidden; scrollLeft driven externally */}
      <div
        ref={rowRef}
        style={{
          background: bodyBg,
          padding: '6px 0',
          overflow: 'hidden',   // ← NOT 'auto'; shared scrollbar drives this
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'baseline', paddingLeft: 12, paddingRight: 24 }}>
          {/* Line number gutter */}
          <span style={{ ...MONO, color: numClr, minWidth: 36, textAlign: 'right', paddingRight: 16, flexShrink: 0 }}>
            {lineNo ?? '·'}
          </span>
          {/* Line content */}
          <span style={{ ...MONO, color: inkClr }}>
            {lineNo === null ? '' : (text || '\u00A0' /* nbsp keeps height */)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

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

export function DiffEditorPanel({
  language, original, modified, dark,
}: DiffEditorPanelProps) {
  // Monaco refs
  const monacoRef  = useRef<Parameters<DiffOnMount>[1] | null>(null)
  const diffEditorRef = useRef<MonacoNS.editor.IStandaloneDiffEditor | null>(null)

  useMonacoTheme(monacoRef.current, dark)

  // Selected-line state
  const [sel, setSel] = useState<SelectedLines>({
    origLine: null,
    modLine:  null,
    origText: '',
    modText:  '',
  })

  // Shared-scroll refs
  const scrollbarRef = useRef<HTMLDivElement>(null)
  const origRowRef   = useRef<HTMLDivElement>(null)
  const modRowRef    = useRef<HTMLDivElement>(null)

  useSharedScroll(scrollbarRef, origRowRef, modRowRef, sel.origText, sel.modText)

  // ── Resolve selection from either side ──────────────────────────────────────
  const resolveSelection = useCallback((
    clickedSide: 'original' | 'modified',
    clickedLine: number,
  ) => {
    const editor = diffEditorRef.current
    if (!editor) return

    const origModel = editor.getOriginalEditor().getModel()
    const modModel  = editor.getModifiedEditor().getModel()

    // getLineChanges() may return null while the diff is still computing
    const changes = editor.getLineChanges() ?? []

    let origLine: number | null
    let modLine:  number | null

    if (clickedSide === 'original') {
      origLine = clickedLine
      modLine  = mapOrigToMod(changes, clickedLine)
    } else {
      modLine  = clickedLine
      origLine = mapModToOrig(changes, clickedLine)
    }

    setSel({
      origLine,
      modLine,
      origText: getLineText(origModel, origLine),
      modText:  getLineText(modModel,  modLine),
    })

    // Reset shared scroll to left so both panels start aligned
    if (scrollbarRef.current) scrollbarRef.current.scrollLeft = 0
    if (origRowRef.current)   origRowRef.current.scrollLeft   = 0
    if (modRowRef.current)    modRowRef.current.scrollLeft    = 0
  }, [])

  // ── Mount handler ────────────────────────────────────────────────────────────
  const handleMount: DiffOnMount = useCallback((editor, monaco) => {
    monacoRef.current    = monaco
    diffEditorRef.current = editor

    const origEditor = editor.getOriginalEditor()
    const modEditor  = editor.getModifiedEditor()

    // Listen for cursor position changes on both sides
    origEditor.onDidChangeCursorPosition((e) => {
      resolveSelection('original', e.position.lineNumber)
    })

    modEditor.onDidChangeCursorPosition((e) => {
      resolveSelection('modified', e.position.lineNumber)
    })
  }, [resolveSelection])

  // ── Re-resolve when content changes (original/modified props update) ─────────
  useEffect(() => {
    const editor = diffEditorRef.current
    if (!editor) return

    // Wait one tick for Monaco to recompute the diff after model update
    const id = window.setTimeout(() => {
      const origEditor = editor.getOriginalEditor()
      const pos = origEditor.getPosition()
      if (pos) resolveSelection('original', pos.lineNumber)
    }, 50)

    return () => window.clearTimeout(id)
  }, [original, modified, resolveSelection])

  const theme = dark ? 'dv-dark' : 'dv-light'

  return (
    <div className="panes">
      <div
        className="diff-full"
        style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {/* ── 1. Pane header ── */}
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
            borderTop: `1px solid ${dark ? '#30363D' : '#D8DCE3'}`,
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