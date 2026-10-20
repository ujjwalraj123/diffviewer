export interface JsonParseResult {
  valid: boolean
  data?: unknown
  error?: {
    message: string
    line?: number
    column?: number
    excerpt?: string
  }
}

export type IndentType = 2 | 4 | 'tab' | 1

export const SAMPLE_JSON = `{
  "tool": "DiffViewer",
  "feature": "JSON Formatter & Validator",
  "version": "1.0.0",
  "active": true,
  "privacy": {
    "clientSide": true,
    "serverUpload": false,
    "encryption": "in-memory-only"
  },
  "capabilities": [
    "format-and-beautify",
    "minify-and-compact",
    "sort-keys-alphabetically",
    "real-time-syntax-validation",
    "instant-diff-comparison"
  ],
  "stats": {
    "speedMs": 0,
    "accuracy": "100%",
    "supportedFormats": ["json", "geojson", "jsonld", "ndjson"]
  }
}`

/**
 * Recursively sorts all keys in objects alphabetically.
 * Preserves the order of array elements.
 */
export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(value as Record<string, unknown>).sort((a, b) => a.localeCompare(b))
    for (const key of keys) {
      sorted[key] = sortJsonKeys((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

/**
 * Parses a JSON string with comprehensive error detection (line, column, snippet).
 */
export function parseJsonWithError(raw: string): JsonParseResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { valid: true, data: null }
  }

  try {
    const data = JSON.parse(raw)
    return { valid: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    let line: number | undefined
    let column: number | undefined

    // Pattern 1: V8 / Chromium / Node / Edge: "at position 42 (line 3 column 10)"
    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10)
      column = parseInt(lineColMatch[2], 10)
    }

    // Pattern 2: "at position 42"
    if (line === undefined) {
      const posMatch = message.match(/position\s+(\d+)/i)
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10)
        const textBefore = raw.slice(0, pos)
        const lines = textBefore.split('\n')
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }
    }

    // Pattern 3: Firefox: "at line 3 column 10"
    if (line === undefined) {
      const firefoxMatch = message.match(/line\s+(\d+)/i)
      if (firefoxMatch) {
        line = parseInt(firefoxMatch[1], 10)
      }
    }

    // Build visual excerpt
    let excerpt: string | undefined
    if (line !== undefined) {
      const allLines = raw.split('\n')
      const targetLine = allLines[line - 1] ?? ''
      if (column !== undefined && column > 0) {
        const pointer = ' '.repeat(Math.max(0, column - 1)) + '^'
        excerpt = `${targetLine}\n${pointer}`
      } else {
        excerpt = targetLine
      }
    }

    return {
      valid: false,
      error: {
        message,
        line,
        column,
        excerpt,
      },
    }
  }
}

/**
 * Formats a valid JSON data object with specified indentation and key sorting.
 */
export function formatJsonData(data: unknown, indent: IndentType, sortKeys = false): string {
  if (data === null || data === undefined) return ''
  const processed = sortKeys ? sortJsonKeys(data) : data
  const spacing = indent === 'tab' ? '\t' : indent
  return JSON.stringify(processed, null, spacing)
}

/**
 * Minifies a valid JSON data object into a compact single-line string.
 */
export function minifyJsonData(data: unknown, sortKeys = false): string {
  if (data === null || data === undefined) return ''
  const processed = sortKeys ? sortJsonKeys(data) : data
  return JSON.stringify(processed)
}
