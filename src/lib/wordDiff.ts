/**
 * wordDiff.ts
 *
 * Produces a word-level (token-level) diff between two strings.
 * Uses a simple LCS-based Myers diff on a token array.
 *
 * Tokens are split on word boundaries so that punctuation, spaces,
 * and identifiers are each their own token — this gives precise
 * character-level highlighting without a heavyweight library.
 *
 * Returns an array of DiffToken objects that can be rendered inline.
 */

export type DiffKind = 'equal' | 'delete' | 'insert'

export interface DiffToken {
  text: string
  kind: DiffKind
}

/** Split a string into tokens: words, whitespace runs, and punctuation chars */
function tokenise(s: string): string[] {
  // Each match is: a run of word chars, OR a run of spaces, OR a single non-word char
  return s.match(/\w+|\s+|[^\w\s]/g) ?? []
}

/**
 * Classic LCS diff on two token arrays.
 * Returns a flat list of DiffToken with kind 'equal' | 'delete' | 'insert'.
 */
function diffTokens(a: string[], b: string[]): DiffToken[] {
  const m = a.length
  const n = b.length

  // dp[i][j] = length of LCS of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to build the diff
  const result: DiffToken[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ text: a[i - 1], kind: 'equal' })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ text: b[j - 1], kind: 'insert' })
      j--
    } else {
      result.push({ text: a[i - 1], kind: 'delete' })
      i--
    }
  }

  return result.reverse()
}

/**
 * Public API: diff two strings at the word/token level.
 *
 * @param origText  The original (left) line text
 * @param modText   The modified (right) line text
 * @param side      Which side to render tokens for:
 *                    'original' → show equal + delete tokens
 *                    'modified' → show equal + insert tokens
 */
export function wordDiff(
  origText: string,
  modText: string,
  side: 'original' | 'modified',
): DiffToken[] {
  if (!origText && !modText) return []

  const aTokens = tokenise(origText)
  const bTokens = tokenise(modText)
  const all = diffTokens(aTokens, bTokens)

  // Filter to only the tokens relevant for this side
  return all.filter(t =>
    t.kind === 'equal' ||
    (side === 'original' && t.kind === 'delete') ||
    (side === 'modified' && t.kind === 'insert'),
  )
}
