import { useRef, useEffect, useCallback, useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react'
import { CopyButton } from './CopyButton'
import { ClipboardPaste, Trash2, FileText, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import { findTextMatches } from '../lib/utils'

interface TextEditorPairProps {
  left: string
  right: string
  onLeftChange: (v: string) => void
  onRightChange: (v: string) => void
  dark?: boolean
  searchSelection?: {
    side: 'original' | 'modified'
    start: number
    length: number
    token: number
  } | null
}

export interface CodeEditorPaneProps {
  title: string
  subTitle?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  readOnly?: boolean
  errorLine?: number | null
  statusBadge?: ReactNode
  extraHeaderActions?: ReactNode
  footer?: ReactNode
  searchable?: boolean
  selectionRequest?: { start: number; length: number; token: number } | undefined
}

export function CodeEditorPane({
  title,
  subTitle,
  value,
  onChange,
  placeholder,
  readOnly = false,
  errorLine,
  statusBadge,
  extraHeaderActions,
  footer,
  searchable = false,
  selectionRequest,
}: CodeEditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)

  const lines = value.split('\n')
  const lineCount = Math.max(lines.length, 1)
  const matches = useMemo(() => findTextMatches(value, searchQuery), [searchQuery, value])
  const selectedMatchIndex =
    matches.length > 0 ? activeMatchIndex % matches.length : -1

  // Synchronize gutter scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Handle Tab key to insert spaces
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (searchable && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      setSearchOpen(true)
      return
    }
    if (readOnly) return
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = '  '

      const newValue = value.substring(0, start) + spaces + value.substring(end)
      onChange(newValue)

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      })
    }
  }

  const handlePaste = useCallback(async () => {
    if (readOnly) return
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange(text)
      }
    } catch {
      // Clipboard permissions denied
    }
  }, [onChange, readOnly])

  const selectMatch = (index: number) => {
    const textarea = textareaRef.current
    const match = matches[index]
    if (!textarea || !match) return
    textarea.focus()
    textarea.setSelectionRange(match.start, match.start + match.length)
    textarea.scrollTop = Math.max(
      0,
      (match.line - 1) * 20 - textarea.clientHeight / 2,
    )
  }

  const navigateMatches = (direction: 1 | -1) => {
    if (matches.length === 0) return
    const nextIndex =
      (selectedMatchIndex + direction + matches.length) % matches.length
    setActiveMatchIndex(nextIndex)
    selectMatch(nextIndex)
  }

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !selectionRequest) return
    textarea.focus()
    textarea.setSelectionRange(
      selectionRequest.start,
      selectionRequest.start + selectionRequest.length,
    )
    textarea.scrollTop = Math.max(
      0,
      (value.slice(0, selectionRequest.start).split('\n').length - 1) * 20 -
        textarea.clientHeight / 2,
    )
  }, [selectionRequest, value])

  useEffect(() => {
    handleScroll()
  }, [value])

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full border border-border/70 rounded-xl bg-card shadow-xs overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-medium">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground tracking-tight truncate">{title}</span>
          {subTitle && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
              ({subTitle})
            </span>
          )}
          {statusBadge}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground tabular-nums">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground tabular-nums">
            {value.length.toLocaleString()} ch
          </span>

          {searchable && (
            <div className="flex items-center gap-1">
              {searchOpen ? (
                <>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setActiveMatchIndex(0)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        navigateMatches(event.shiftKey ? -1 : 1)
                      } else if (event.key === 'Escape') {
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                    placeholder="Search JSON"
                    aria-label="Search JSON content"
                    className="h-7 w-28 sm:w-36 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  <span
                    aria-live="polite"
                    className="min-w-8 text-center text-[10px] font-mono text-muted-foreground tabular-nums"
                  >
                    {searchQuery ? `${selectedMatchIndex + 1}/${matches.length}` : '0/0'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateMatches(-1)}
                    disabled={matches.length === 0}
                    title="Previous match (Shift+Enter)"
                    aria-label="Previous search match"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMatches(1)}
                    disabled={matches.length === 0}
                    title="Next match (Enter)"
                    aria-label="Next search match"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    title="Close search (Escape)"
                    aria-label="Close search"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  title="Search JSON (Ctrl+F)"
                  aria-label="Search JSON content"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Search className="size-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          {extraHeaderActions}

          {!readOnly && (
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <ClipboardPaste className="size-3.5" />
            </button>
          )}

          <CopyButton text={value} />

          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={!value}
              title="Clear content"
              className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {searchable && searchOpen && searchQuery && (
        <div
          role="listbox"
          aria-label="JSON search results"
          className="max-h-48 shrink-0 overflow-y-auto border-b border-border/60 bg-popover p-1 text-popover-foreground shadow-sm"
        >
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground" role="status">
              No results found
            </div>
          ) : (
            matches.map((match, index) => (
              <button
                key={`${match.start}-${match.value}`}
                type="button"
                role="option"
                aria-selected={selectedMatchIndex === index}
                onClick={() => {
                  setActiveMatchIndex(index)
                  selectMatch(index)
                }}
                title={`Line ${match.line} — ${match.value}`}
                className={`block w-full truncate rounded-md px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                  selectedMatchIndex === index
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <span className="font-sans font-medium text-muted-foreground">{match.line}</span>
                <span className="px-1.5 text-muted-foreground">—</span>
                <span>{match.value}</span>
                {match.fuzzy && (
                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] text-primary">
                    Closest match
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Pane Editor Body */}
      <div className="flex-1 flex min-h-[360px] md:min-h-0 relative bg-background/50 font-mono text-[13px]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 shrink-0 py-3 text-right pr-3 select-none text-muted-foreground/35 border-r border-border/40 overflow-hidden text-xs leading-[20px] font-mono"
        >
          {Array.from({ length: lineCount }, (_, i) => {
            const isError = errorLine !== undefined && errorLine !== null && i + 1 === errorLine
            return (
              <div
                key={i + 1}
                className={`h-[20px] transition-colors ${
                  isError ? 'bg-destructive/25 text-destructive font-bold' : ''
                }`}
              >
                {i + 1}
              </div>
            )
          })}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className={`flex-1 p-3 bg-transparent text-foreground placeholder:text-muted-foreground/40 selection:bg-primary/40 selection:text-foreground resize-none outline-none leading-[20px] font-mono text-[13px] whitespace-pre overflow-x-auto overflow-y-hidden ${
            readOnly ? 'cursor-default' : ''
          }`}
        />
      </div>

      {footer}
    </div>
  )
}

export function TextEditorPair({
  left,
  right,
  onLeftChange,
  onRightChange,
  searchSelection,
}: TextEditorPairProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px] p-4">
      <CodeEditorPane
        title="Original"
        subTitle="Before"
        value={left}
        onChange={onLeftChange}
        placeholder="Paste or type original text here..."
        selectionRequest={
          searchSelection?.side === 'original' ? searchSelection : undefined
        }
      />

      <CodeEditorPane
        title="Modified"
        subTitle="After"
        value={right}
        onChange={onRightChange}
        placeholder="Paste or type modified text here..."
        selectionRequest={
          searchSelection?.side === 'modified' ? searchSelection : undefined
        }
      />
    </div>
  )
}