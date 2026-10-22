import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface TextSearchMatch {
  start: number
  length: number
  line: number
  value: string
  fuzzy: boolean
}

function getEditDistance(left: string, right: string, limit: number): number {
  const leftChars = Array.from(left)
  const rightChars = Array.from(right)
  if (Math.abs(leftChars.length - rightChars.length) > limit) return limit + 1

  let previousRow = Array.from({ length: rightChars.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= leftChars.length; leftIndex += 1) {
    const currentRow = [leftIndex]
    let rowMinimum = leftIndex

    for (let rightIndex = 1; rightIndex <= rightChars.length; rightIndex += 1) {
      const substitutionCost =
        leftChars[leftIndex - 1] === rightChars[rightIndex - 1] ? 0 : 1
      const distance = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      )
      currentRow.push(distance)
      rowMinimum = Math.min(rowMinimum, distance)
    }

    if (rowMinimum > limit) return limit + 1
    previousRow = currentRow
  }

  return previousRow[rightChars.length]
}

export function findTextMatches(value: string, searchQuery: string): TextSearchMatch[] {
  if (!searchQuery) return []
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const expression = new RegExp(escapedQuery, 'giu')
  const found: TextSearchMatch[] = []
  let line = 1
  let lineScanIndex = 0
  let match: RegExpExecArray | null

  while ((match = expression.exec(value)) !== null) {
    while (lineScanIndex < match.index) {
      if (value[lineScanIndex] === '\n') line += 1
      lineScanIndex += 1
    }
    found.push({
      start: match.index,
      length: match[0].length,
      line,
      value: match[0],
      fuzzy: false,
    })
  }

  if (found.length > 0) return found

  const query = searchQuery.trim().replace(/^["']|["']$/g, '').toLocaleLowerCase()
  const queryLength = Array.from(query).length
  if (queryLength < 3) return []

  const maxDistance = Math.min(3, Math.max(1, Math.floor(queryLength * 0.25)))
  const tokenExpression = /[\p{L}\p{N}_-]+/gu
  const fuzzyMatches: Array<TextSearchMatch & { distance: number }> = []
  let closestDistance = maxDistance + 1
  line = 1
  lineScanIndex = 0

  while ((match = tokenExpression.exec(value)) !== null) {
    while (lineScanIndex < match.index) {
      if (value[lineScanIndex] === '\n') line += 1
      lineScanIndex += 1
    }

    const distance = getEditDistance(query, match[0].toLocaleLowerCase(), maxDistance)
    if (distance > maxDistance || distance > closestDistance) continue
    if (distance < closestDistance) {
      closestDistance = distance
      fuzzyMatches.length = 0
    }
    fuzzyMatches.push({
      start: match.index,
      length: match[0].length,
      line,
      value: match[0],
      fuzzy: true,
      distance,
    })
  }

  return fuzzyMatches.map(({ distance: _distance, ...result }) => result)
}
