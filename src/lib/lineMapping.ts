/**
 * lineMapping.ts
 *
 * Pure helpers that translate a line number on one side of a Monaco diff
 * to the best-effort corresponding line number on the other side.
 *
 * Uses Monaco's ILineChange[] (from editor.getLineChanges()) — no external
 * diff library needed.
 *
 * ILineChange encoding:
 *   originalEndLineNumber  === 0  → pure insertion  (no original lines removed)
 *   modifiedEndLineNumber  === 0  → pure deletion   (no modified lines added)
 */

import type * as MonacoNS from 'monaco-editor'

export type LineChange = MonacoNS.editor.ILineChange

/**
 * Map an original line number → corresponding modified line number.
 * Returns null when the original line was purely deleted (no mod counterpart).
 */
export function mapOrigToMod(
  changes: LineChange[],
  origLine: number,
): number | null {
  let offset = 0

  for (const c of changes) {
    const oStart = c.originalStartLineNumber
    const oEnd   = c.originalEndLineNumber  // 0 = pure insertion block
    const mStart = c.modifiedStartLineNumber
    const mEnd   = c.modifiedEndLineNumber  // 0 = pure deletion block

    // Line falls inside a changed original range
    if (oEnd > 0 && origLine >= oStart && origLine <= oEnd) {
      if (mEnd === 0) return null // pure deletion — no modified counterpart
      const ratio = (origLine - oStart) / Math.max(oEnd - oStart, 1)
      return Math.min(mStart + Math.round(ratio * (mEnd - mStart)), mEnd)
    }

    // Accumulate offset for changes that are entirely before our line
    if (origLine > (oEnd > 0 ? oEnd : oStart - 1)) {
      const origLen = oEnd > 0 ? oEnd - oStart + 1 : 0
      const modLen  = mEnd > 0 ? mEnd - mStart + 1 : 0
      offset += modLen - origLen
    }
  }

  return origLine + offset
}

/**
 * Map a modified line number → corresponding original line number.
 * Returns null when the modified line was purely inserted (no orig counterpart).
 */
export function mapModToOrig(
  changes: LineChange[],
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

/**
 * Safely read a single line from a Monaco text model.
 * Returns '' for null model, null line, or out-of-range line.
 */
export function getLineText(
  model: MonacoNS.editor.ITextModel | null,
  line: number | null,
): string {
  if (!model || line === null) return ''
  if (line < 1 || line > model.getLineCount()) return ''
  return model.getLineContent(line)
}
