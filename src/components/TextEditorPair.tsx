import { useRef, useEffect, useCallback, type ChangeEvent, type KeyboardEvent } from 'react'
import { CopyButton } from './CopyButton'
import { ClipboardPaste, Trash2, FileText } from 'lucide-react'

interface TextEditorPairProps {
  left: string
  right: string
  onLeftChange: (v: string) => void
  onRightChange: (v: string) => void
  dark?: boolean
}

function CodeEditorPane({
  title,
  subTitle,
  value,
  onChange,
  placeholder,
}: {
  title: string
  subTitle?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = value.split('\n')
  const lineCount = Math.max(lines.length, 1)

  // Synchronize gutter scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Handle Tab key to insert spaces
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange(text)
      }
    } catch {
      // Clipboard permissions denied
    }
  }, [onChange])

  useEffect(() => {
    handleScroll()
  }, [value])

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full border border-border/70 rounded-xl bg-card shadow-xs overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-medium">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground tracking-tight">{title}</span>
          {subTitle && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              ({subTitle})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground tabular-nums">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground tabular-nums">
            {value.length.toLocaleString()} ch
          </span>

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <ClipboardPaste className="size-3.5" />
          </button>

          <CopyButton text={value} />

          <button
            type="button"
            onClick={() => onChange('')}
            disabled={!value}
            title="Clear content"
            className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Pane Editor Body */}
      <div className="flex-1 flex min-h-[360px] md:min-h-0 relative bg-background/50 font-mono text-[13px]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 shrink-0 py-3 text-right pr-3 select-none text-muted-foreground/35 border-r border-border/40 overflow-hidden text-xs leading-[20px] font-mono"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-[20px]">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className="flex-1 p-3 bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-[20px] font-mono text-[13px] whitespace-pre overflow-auto"
        />
      </div>
    </div>
  )
}

export function TextEditorPair({
  left,
  right,
  onLeftChange,
  onRightChange,
}: TextEditorPairProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px] p-4">
      <CodeEditorPane
        title="Original"
        subTitle="Before"
        value={left}
        onChange={onLeftChange}
        placeholder="Paste or type original text here..."
      />

      <CodeEditorPane
        title="Modified"
        subTitle="After"
        value={right}
        onChange={onRightChange}
        placeholder="Paste or type modified text here..."
      />
    </div>
  )
}