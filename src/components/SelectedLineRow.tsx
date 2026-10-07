/**
 * SelectedLineRow
 *
 * One of the two "selected line" panels that sit below the main DiffEditor.
 * Renders a sub-header (label + line number) and a single content row whose
 * scrollLeft is driven externally by the shared scrollbar — it never scrolls
 * on its own (overflow: hidden).
 *
 * A copy button in the header copies the raw line text to the clipboard.
 * It shows a brief "✓" tick for 1.5 s after a successful copy.
 */

import { useState, useCallback, type CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedLineRowProps {
  label:  string
  lineNo: number | null   // null = no corresponding line on this side
  text:   string
  dark:   boolean
  rowRef: React.RefObject<HTMLDivElement | null>
}

// ─── Shared monospace style ───────────────────────────────────────────────────

const MONO: CSSProperties = {
  fontFamily: "'ui-monospace','SFMono-Regular','SF Mono',Menlo,Consolas,monospace",
  fontSize: 13,
  lineHeight: '22px',
  whiteSpace: 'pre',
  overflow: 'hidden',
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, dark }: { text: string; dark: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }, [text])

  const muted   = dark ? '#8B949E' : '#6B7280'
  const hover   = dark ? '#58A6FF' : '#126BCF'
  const border  = dark ? '#30363D' : '#D8DCE3'
  const bg      = dark ? '#161B22' : '#F4F6FA'

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      title={copied ? 'Copied!' : 'Copy line'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        border: `1px solid ${border}`,
        borderRadius: 4,
        background: bg,
        color: copied ? hover : muted,
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 500,
        cursor: text ? 'pointer' : 'default',
        opacity: text ? 1 : 0.35,
        transition: 'color 0.15s, border-color 0.15s',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (text) (e.currentTarget as HTMLButtonElement).style.color = hover }}
      onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLButtonElement).style.color = muted }}
    >
      {copied ? (
        // Tick icon
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      ) : (
        // Copy icon
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <path d="M2 8V2a1 1 0 0 1 1-1h6" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── SelectedLineRow ──────────────────────────────────────────────────────────

export function SelectedLineRow({ label, lineNo, text, dark, rowRef }: SelectedLineRowProps) {
  const headerBg  = dark ? '#161B22' : '#F4F6FA'
  const headerClr = dark ? '#8B949E' : '#6B7280'
  const bodyBg    = dark ? '#0D1117' : '#FFFFFF'
  const inkClr    = dark ? '#E6EDF3' : '#16181D'
  const numClr    = dark ? '#484F58' : '#9CA3AF'
  const borderClr = dark ? '#30363D' : '#D8DCE3'

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
        {/* Left: label + line number */}
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

        {/* Right: copy button */}
        <CopyButton text={text} dark={dark} />
      </div>

      {/* ── Content row — scrollLeft driven by shared scrollbar ── */}
      <div
        ref={rowRef}
        style={{
          background: bodyBg,
          padding: '6px 0',
          overflow: 'hidden',   // ← intentional; shared scrollbar drives this
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          paddingLeft: 12,
          paddingRight: 24,
        }}>
          {/* Gutter */}
          <span style={{ ...MONO, color: numClr, minWidth: 36, textAlign: 'right', paddingRight: 16, flexShrink: 0 }}>
            {lineNo ?? '·'}
          </span>
          {/* Content */}
          <span style={{ ...MONO, color: inkClr }}>
            {lineNo === null ? '' : (text || '\u00A0')}
          </span>
        </div>
      </div>

    </div>
  )
}
