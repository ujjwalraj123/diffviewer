/**
 * SelectedLineRow
 *
 * Editable single-line panel that sits below the main DiffEditor.
 *
 * Features:
 *  • Editable via a <textarea> (single-row, no wrap, horizontal scroll)
 *  • Word-level diff highlights rendered as a background overlay layer
 *    (the classic "highlight backdrop + transparent textarea on top" pattern)
 *  • Copy button in the sub-header
 *  • scrollLeft driven externally by the shared scrollbar
 *
 * The highlight layer and the textarea share identical font/size/padding so
 * the highlight spans land exactly under the right characters.
 */

import { useRef, useEffect, type CSSProperties } from 'react'
import { wordDiff } from '../lib/wordDiff'
import { CopyButton } from './CopyButton'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedLineRowProps {
  label:        string
  side:         'original' | 'modified'
  lineNo:       number | null
  text:         string
  peerText:     string
  dark:         boolean
  /** Ref forwarded to the <textarea> — used by useSharedScroll */
  textareaRef:  React.RefObject<HTMLTextAreaElement | null>
  onChange:     (newText: string) => void
}

// ─── Shared text style (must be identical on highlight layer + textarea) ──────

const MONO_STYLE: CSSProperties = {
  fontFamily: "'ui-monospace','SFMono-Regular','SF Mono',Menlo,Consolas,monospace",
  fontSize: 13,
  lineHeight: '22px',
  letterSpacing: 0,
  whiteSpace: 'pre',
  wordBreak: 'normal',
  overflowWrap: 'normal',
}

// ─── Highlight colours ────────────────────────────────────────────────────────

function highlightBg(kind: 'delete' | 'insert', dark: boolean): string {
  if (kind === 'delete') return dark ? 'rgba(248,81,73,0.30)' : 'rgba(220,38,38,0.15)'
  return dark ? 'rgba(63,185,80,0.28)' : 'rgba(10,123,62,0.13)'
}

// ─── SelectedLineRow ──────────────────────────────────────────────────────────

export function SelectedLineRow({
  label, side, lineNo, text, peerText, dark, textareaRef, onChange,
}: SelectedLineRowProps) {
  const headerBg  = dark ? '#161B22' : '#F4F6FA'
  const headerClr = dark ? '#8B949E' : '#6B7280'
  const bodyBg    = dark ? '#0D1117' : '#FFFFFF'
  const inkClr    = dark ? '#E6EDF3' : '#16181D'
  const numClr    = dark ? '#484F58' : '#9CA3AF'
  const borderClr = dark ? '#30363D' : '#D8DCE3'

  // Gutter width: fixed 52px (line-number + right-padding)
  const GUTTER = 52

  // Sync the highlight layer's scrollLeft to match the textarea whenever
  // the textarea scrolls — so highlights stay aligned with visible text.
  const highlightRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ta = textareaRef.current
    const hl = highlightRef.current
    if (!ta || !hl) return
    const onScroll = () => { hl.scrollLeft = ta.scrollLeft }
    ta.addEventListener('scroll', onScroll, { passive: true })
    return () => ta.removeEventListener('scroll', onScroll)
  }, [textareaRef])

  return (
    <div style={{ borderTop: `1px solid ${borderClr}` }}>

      {/* ── Sub-header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        background: headerBg,
        borderBottom: `1px solid ${borderClr}`,
        userSelect: 'none',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: headerClr,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
          {lineNo !== null ? (
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
              — Line {lineNo}
            </span>
          ) : (
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, opacity: 0.5 }}>
              — no corresponding line
            </span>
          )}
        </span>
        <CopyButton text={text} dark={dark} />
      </div>

      {/* ── Content row ── */}
      <div style={{
        position: 'relative',
        background: bodyBg,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Line-number gutter — sticky left, always visible */}
        <span style={{
          ...MONO_STYLE,
          flexShrink: 0,
          width: GUTTER,
          paddingLeft: 12,
          paddingTop: 6,
          paddingBottom: 6,
          textAlign: 'right',
          paddingRight: 16,
          color: numClr,
          userSelect: 'none',
          zIndex: 2,
          background: bodyBg,
        }}>
          {lineNo ?? '·'}
        </span>

        {/* Highlight + textarea wrapper */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden' }}>

          {/* Highlight layer — scrolls in sync with textarea via the effect above */}
          {lineNo !== null && (
            <div
              ref={highlightRef}
              aria-hidden
              style={{
                ...MONO_STYLE,
                position: 'absolute',
                inset: 0,
                paddingLeft: 0,
                paddingRight: 24,
                paddingTop: 6,
                paddingBottom: 6,
                pointerEvents: 'none',
                color: 'transparent',
                overflowX: 'hidden',
                overflowY: 'hidden',
              }}
            >
              {wordDiff(
                side === 'original' ? text : peerText,
                side === 'modified'  ? text : peerText,
                side,
              ).map((t, i) =>
                t.kind === 'equal' ? (
                  <span key={i}>{t.text}</span>
                ) : (
                  <mark key={i} style={{
                    background: highlightBg(t.kind, dark),
                    color: 'transparent',
                    borderRadius: 2,
                  }}>
                    {t.text}
                  </mark>
                )
              )}
            </div>
          )}

          {/* Editable textarea — this IS the scroll source */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={lineNo === null ? '' : text}
            disabled={lineNo === null}
            onChange={e => onChange(e.target.value)}
            spellCheck={false}
            style={{
              ...MONO_STYLE,
              position: 'relative',
              zIndex: 1,
              display: 'block',
              width: '100%',
              padding: '6px 24px 6px 0',
              margin: 0,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: inkClr,
              caretColor: inkClr,
              overflowX: 'auto',   // ← textarea scrolls freely
              overflowY: 'hidden',
              height: 34,
              minHeight: 34,
              maxHeight: 34,
            }}
          />
        </div>
      </div>

    </div>
  )
}
