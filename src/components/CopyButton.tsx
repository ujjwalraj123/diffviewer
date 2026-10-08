/**
 * CopyButton — shared icon-only copy-to-clipboard button.
 *
 * Renders a small copy SVG icon. On success it briefly shows a tick for 1.5 s.
 * Disabled + dimmed when `text` is empty.
 */

import { useState, useCallback } from 'react'

interface CopyButtonProps {
  text: string
  dark: boolean
}

export function CopyButton({ text, dark }: CopyButtonProps) {
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

  const muted  = dark ? '#8B949E' : '#6B7280'
  const accent = dark ? '#58A6FF' : '#126BCF'

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        padding: 0,
        border: 'none',
        borderRadius: 3,
        background: 'transparent',
        color: copied ? accent : muted,
        cursor: text ? 'pointer' : 'default',
        opacity: text ? 1 : 0.3,
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (text && !copied)
          (e.currentTarget as HTMLButtonElement).style.color = accent
      }}
      onMouseLeave={e => {
        if (!copied)
          (e.currentTarget as HTMLButtonElement).style.color = muted
      }}
    >
      {copied ? (
        // Tick
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      ) : (
        // Copy
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none"
             stroke="currentColor" strokeWidth="1.5"
             strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <path d="M2 8V2a1 1 0 0 1 1-1h6" />
        </svg>
      )}
    </button>
  )
}
