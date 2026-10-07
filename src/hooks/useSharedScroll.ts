/**
 * useSharedScroll
 *
 * Wires ONE external scrollbar div to drive the scrollLeft of two
 * "content" row divs simultaneously.
 *
 * The content rows must have  overflow: hidden  — they never scroll on their
 * own; only the shared scrollbar moves them.
 *
 * A phantom <div> inside the scrollbar is resized to
 *   max(origRow.scrollWidth, modRow.scrollWidth)
 * so the scrollbar thumb reflects the true content width.
 */

import { useEffect } from 'react'
import type React from 'react'

export function useSharedScroll(
  scrollbarRef: React.RefObject<HTMLDivElement | null>,
  origRowRef:   React.RefObject<HTMLDivElement | null>,
  modRowRef:    React.RefObject<HTMLDivElement | null>,
  /** Re-run spacer sizing whenever either text changes */
  origText: string,
  modText:  string,
) {
  // ── Resize phantom spacer whenever content changes ──────────────────────────
  useEffect(() => {
    const bar     = scrollbarRef.current
    const origRow = origRowRef.current
    const modRow  = modRowRef.current
    if (!bar || !origRow || !modRow) return

    const spacer = bar.firstElementChild as HTMLElement | null
    if (!spacer) return

    // Use rAF so the DOM has painted the new text before we measure
    const raf = requestAnimationFrame(() => {
      const w = Math.max(origRow.scrollWidth, modRow.scrollWidth)
      spacer.style.width = `${w}px`
    })

    return () => cancelAnimationFrame(raf)
  }, [origText, modText, scrollbarRef, origRowRef, modRowRef])

  // ── Propagate scroll position: scrollbar → both rows ───────────────────────
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
