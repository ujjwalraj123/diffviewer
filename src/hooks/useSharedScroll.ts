/**
 * useSharedScroll
 *
 * Synchronises horizontal scroll across:
 *   • origTextarea  — the original selected-line textarea
 *   • modTextarea   — the modified selected-line textarea
 *   • scrollbarDiv  — the single shared scrollbar at the bottom
 *
 * Architecture (scroll SOURCE → targets):
 *   User scrolls origTextarea  → scrollbarDiv + modTextarea follow
 *   User scrolls modTextarea   → scrollbarDiv + origTextarea follow
 *   User drags scrollbarDiv    → origTextarea + modTextarea follow
 *
 * The scrollbar's phantom spacer is sized to
 *   max(origTextarea.scrollWidth, modTextarea.scrollWidth)
 * so the thumb accurately represents the content width.
 *
 * Guards prevent echo loops (A fires → sets B → B fires → sets A → …).
 */

import { useEffect } from 'react'
import type React from 'react'

export function useSharedScroll(
  scrollbarRef:    React.RefObject<HTMLDivElement      | null>,
  origTextareaRef: React.RefObject<HTMLTextAreaElement | null>,
  modTextareaRef:  React.RefObject<HTMLTextAreaElement | null>,
  origText: string,
  modText:  string,
) {
  // ── Resize phantom spacer whenever text changes ─────────────────────────────
  useEffect(() => {
    const bar  = scrollbarRef.current
    const orig = origTextareaRef.current
    const mod  = modTextareaRef.current
    if (!bar || !orig || !mod) return

    const spacer = bar.firstElementChild as HTMLElement | null
    if (!spacer) return

    const raf = requestAnimationFrame(() => {
      const w = Math.max(orig.scrollWidth, mod.scrollWidth)
      spacer.style.width = `${w}px`
    })
    return () => cancelAnimationFrame(raf)
  }, [origText, modText, scrollbarRef, origTextareaRef, modTextareaRef])

  // ── Wire scroll events ──────────────────────────────────────────────────────
  useEffect(() => {
    const bar  = scrollbarRef.current
    const orig = origTextareaRef.current
    const mod  = modTextareaRef.current
    if (!bar || !orig || !mod) return

    let syncing = false   // re-entrancy guard

    const syncFrom = (source: HTMLElement, ...targets: HTMLElement[]) => {
      if (syncing) return
      syncing = true
      const sl = source.scrollLeft
      for (const t of targets) t.scrollLeft = sl
      syncing = false
    }

    const onOrig = () => syncFrom(orig, mod, bar)
    const onMod  = () => syncFrom(mod,  orig, bar)
    const onBar  = () => syncFrom(bar,  orig, mod)

    orig.addEventListener('scroll', onOrig, { passive: true })
    mod.addEventListener('scroll',  onMod,  { passive: true })
    bar.addEventListener('scroll',  onBar,  { passive: true })

    return () => {
      orig.removeEventListener('scroll', onOrig)
      mod.removeEventListener('scroll',  onMod)
      bar.removeEventListener('scroll',  onBar)
    }
  }, [scrollbarRef, origTextareaRef, modTextareaRef])
}
