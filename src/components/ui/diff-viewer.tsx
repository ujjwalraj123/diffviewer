"use client";

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import { cva, type VariantProps } from "class-variance-authority";
import { diffLines, diffChars } from "diff";
import { CheckIcon, CopyIcon } from "lucide-react";
import parseDiff from "parse-diff";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

type DiffLineType = "add" | "del" | "normal" | "marker";

export type DiffEditableSide = "old" | "new";
export type DiffSearchSide = "original" | "modified";

export interface DiffSearchSelection {
  side: DiffSearchSide;
  line: number;
  column: number;
  length: number;
}

export interface DiffCharSegment {
  text: string;
  type: "normal" | "add" | "del";
}

interface ParsedLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number | undefined;
  newLineNumber?: number | undefined;
  charSegments?: DiffCharSegment[];
}

interface ParsedHunk {
  header: string;
  lines: ParsedLine[];
}

interface ParsedFile {
  oldName?: string | undefined;
  newName?: string | undefined;
  lines: ParsedLine[];
  hunks: ParsedHunk[];
  additions: number;
  deletions: number;
}

interface SplitLinePair {
  left: ParsedLine | null;
  right: ParsedLine | null;
}

function parsePatch(patch: string): ParsedFile[] {
  const files = parseDiff(patch);
  return files.map((file) => {
    const hunks = file.chunks.map((chunk) => {
      const lines: ParsedLine[] = [];
      for (const change of chunk.changes) {
        if (change.content.startsWith("\\")) {
          lines.push({ type: "marker", content: change.content });
        } else if (change.type === "add") {
          lines.push({
            type: "add",
            content: change.content.slice(1),
            newLineNumber: change.ln,
          });
        } else if (change.type === "del") {
          lines.push({
            type: "del",
            content: change.content.slice(1),
            oldLineNumber: change.ln,
          });
        } else {
          lines.push({
            type: "normal",
            content: change.content.slice(1),
            oldLineNumber: change.ln1,
            newLineNumber: change.ln2,
          });
        }
      }
      return { header: chunk.content, lines };
    });

    const lines = hunks.flatMap((hunk) => hunk.lines);
    attachCharSegments(lines);
    let additions = 0;
    let deletions = 0;
    for (const line of lines) {
      if (line.type === "add") additions++;
      if (line.type === "del") deletions++;
    }
    return {
      oldName: file.from,
      newName: file.to,
      lines,
      hunks,
      additions,
      deletions,
    };
  });
}

function computeCharDiff(oldLineText: string, newLineText: string): {
  delSegments: DiffCharSegment[];
  addSegments: DiffCharSegment[];
} {
  const parts = diffChars(oldLineText, newLineText);
  const delSegments: DiffCharSegment[] = [];
  const addSegments: DiffCharSegment[] = [];

  for (const part of parts) {
    if (part.removed) {
      delSegments.push({ text: part.value, type: "del" });
    } else if (part.added) {
      addSegments.push({ text: part.value, type: "add" });
    } else {
      delSegments.push({ text: part.value, type: "normal" });
      addSegments.push({ text: part.value, type: "normal" });
    }
  }

  return { delSegments, addSegments };
}

function attachCharSegments(lines: ParsedLine[]) {
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    if (cur.type === "normal" || cur.type === "marker") {
      cur.charSegments = [{ text: cur.content, type: "normal" }];
      i++;
      continue;
    }

    const delLines: ParsedLine[] = [];
    while (i < lines.length && lines[i].type === "del") {
      delLines.push(lines[i]);
      i++;
    }

    const addLines: ParsedLine[] = [];
    while (i < lines.length && lines[i].type === "add") {
      addLines.push(lines[i]);
      i++;
    }

    const minLen = Math.min(delLines.length, addLines.length);

    for (let k = 0; k < minLen; k++) {
      const del = delLines[k];
      const add = addLines[k];
      const { delSegments, addSegments } = computeCharDiff(del.content, add.content);
      del.charSegments = delSegments;
      add.charSegments = addSegments;
    }

    for (let k = minLen; k < delLines.length; k++) {
      delLines[k].charSegments = [{ text: delLines[k].content, type: "del" }];
    }

    for (let k = minLen; k < addLines.length; k++) {
      addLines[k].charSegments = [{ text: addLines[k].content, type: "add" }];
    }
  }
}

/**
 * Normalize text before diffing so that cosmetic-only differences that users
 * never intend to see as "changes" are ignored:
 *  - Convert CRLF / CR line endings to LF (pasting often injects \r\n).
 *  - Strip a single trailing newline so "foo" and "foo\n" are treated equal.
 * This prevents the diff viewer from reporting every line as changed when the
 * two inputs are effectively identical.
 */
function normalizeForDiff(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
}

function computeDiff(
  oldContent: string,
  newContent: string,
): {
  lines: ParsedLine[];
  hunks: ParsedHunk[];
  additions: number;
  deletions: number;
} {
  const changes = diffLines(
    normalizeForDiff(oldContent),
    normalizeForDiff(newContent),
  );
  const lines: ParsedLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const contentLines = change.value.replace(/\n$/, "").split("\n");
    for (const content of contentLines) {
      if (change.added) {
        additions++;
        lines.push({ type: "add", content, newLineNumber: newLine++ });
      } else if (change.removed) {
        deletions++;
        lines.push({ type: "del", content, oldLineNumber: oldLine++ });
      } else {
        lines.push({
          type: "normal",
          content,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        });
      }
    }
  }
  const oldLines = lines.filter((line) => line.type !== "add").length;
  const newLines = lines.filter((line) => line.type !== "del").length;
  const oldStart = oldLines === 0 ? 0 : 1;
  const newStart = newLines === 0 ? 0 : 1;

  attachCharSegments(lines);

  return {
    lines,
    hunks: [
      {
        header: `@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`,
        lines,
      },
    ],
    additions,
    deletions,
  };
}

function formatDiffLine(line: ParsedLine): string {
  if (line.type === "marker") return line.content;
  const indicator = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";
  return `${indicator}${line.content}`;
}

function formatDiffFileName(name: string | undefined, prefix: "a" | "b") {
  return name === "/dev/null" ? name : `${prefix}/${name ?? "file"}`;
}

function formatUnifiedDiff(file: ParsedFile): string {
  return [
    `--- ${formatDiffFileName(file.oldName, "a")}`,
    `+++ ${formatDiffFileName(file.newName, "b")}`,
    ...file.hunks.flatMap((hunk) => [
      hunk.header,
      ...hunk.lines.map(formatDiffLine),
    ]),
  ].join("\n");
}

function pairLinesForSplit(lines: ParsedLine[]): SplitLinePair[] {
  const pairs: SplitLinePair[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.type === "normal") {
      pairs.push({ left: line, right: line });
      i++;
    } else if (line.type === "del") {
      const deletions: ParsedLine[] = [];
      while (i < lines.length && lines[i]!.type === "del") {
        deletions.push(lines[i]!);
        i++;
      }
      const additions: ParsedLine[] = [];
      while (i < lines.length && lines[i]!.type === "add") {
        additions.push(lines[i]!);
        i++;
      }
      const maxLen = Math.max(deletions.length, additions.length);
      for (let j = 0; j < maxLen; j++) {
        pairs.push({
          left: deletions[j] ?? null,
          right: additions[j] ?? null,
        });
      }
    } else {
      pairs.push({ left: null, right: line });
      i++;
    }
  }
  return pairs;
}

const diffViewerVariants = cva(
  "aui-diff-viewer overflow-hidden font-mono leading-relaxed [font-variant-ligatures:none]",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 bg-foreground/[0.025] dark:bg-foreground/[0.04] border",
        ghost: "bg-transparent",
        muted:
          "border-foreground/10 bg-foreground/[0.06] dark:bg-foreground/[0.08] border",
      },
      size: {
        sm: "text-[11px]",
        default: "text-[12.5px]",
        lg: "text-[13.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const diffLineVariants = cva("flex", {
  variants: {
    type: {
      add: "bg-[var(--diff-add-bg,var(--_diff-add-bg))] shadow-[inset_2px_0_0_var(--diff-add-rule,var(--color-green-500))] [--_diff-add-bg:color-mix(in_oklab,var(--color-green-500)_8%,transparent)] dark:[--_diff-add-bg:color-mix(in_oklab,var(--color-green-500)_15%,transparent)]",
      del: "bg-[var(--diff-del-bg,var(--_diff-del-bg))] shadow-[inset_2px_0_0_var(--diff-del-rule,var(--color-red-500))] [--_diff-del-bg:color-mix(in_oklab,var(--color-red-500)_8%,transparent)] dark:[--_diff-del-bg:color-mix(in_oklab,var(--color-red-500)_15%,transparent)]",
      normal: "",
      marker: "",
      empty: "",
    },
  },
  defaultVariants: {
    type: "normal",
  },
});

const diffLineTextVariants = cva("", {
  variants: {
    type: {
      add: "text-[var(--diff-add-text,var(--color-green-600))] dark:text-[var(--diff-add-text-dark,var(--color-green-400))]",
      del: "text-[var(--diff-del-text,var(--color-red-600))] dark:text-[var(--diff-del-text-dark,var(--color-red-400))]",
      normal: "",
      marker: "",
      empty: "",
    },
  },
  defaultVariants: {
    type: "normal",
  },
});

function getFileExtension(filename?: string | undefined): string {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (!ext) return "";
  return ext.toUpperCase();
}

function DiffViewerFileBadge({ filename }: { filename?: string | undefined }) {
  const ext = getFileExtension(filename);
  if (!ext) return null;

  return (
    <span
      data-slot="diff-viewer-file-badge"
      className="border-foreground/15 text-muted-foreground/70 inline-flex h-4 shrink-0 items-center border px-1 text-[9px] leading-none font-medium tracking-wide"
    >
      {ext}
    </span>
  );
}

function DiffViewerStats({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <span
      data-slot="diff-viewer-stats"
      className="flex shrink-0 gap-1.5 text-[11px] tabular-nums"
    >
      <span className="text-green-600 dark:text-green-400">+{additions}</span>
      <span className="text-red-600 dark:text-red-400">−{deletions}</span>
    </span>
  );
}

function DiffViewerFile({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="diff-viewer-file" className={cn(className)} {...props} />
  );
}

function DiffViewerContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="diff-viewer-content"
      className={cn("overflow-x-auto", className)}
      {...props}
    />
  );
}

interface DiffViewerHeaderProps extends ComponentProps<"div"> {
  oldName?: string | undefined;
  newName?: string | undefined;
  additions?: number | undefined;
  deletions?: number | undefined;
  showIcon?: boolean | undefined;
  showStats?: boolean | undefined;
  copyText?: string | undefined;
  copyable?: boolean | undefined;
}

function DiffViewerHeader({
  oldName,
  newName,
  additions = 0,
  deletions = 0,
  showIcon = false,
  showStats = true,
  copyText,
  copyable = true,
  className,
  ...props
}: DiffViewerHeaderProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    copiedDuration: 1500,
  });

  if (!oldName && !newName) return null;

  const displayName = newName || oldName;

  return (
    <div
      data-slot="diff-viewer-header"
      className={cn(
        "border-foreground/10 text-muted-foreground flex h-9 items-center gap-2 border-b ps-3.5 pe-3 text-[11px] font-medium tracking-wide",
        className,
      )}
      {...props}
    >
      {showIcon && <DiffViewerFileBadge filename={displayName} />}
      <span className="min-w-0 flex-1 truncate">
        {oldName && newName && oldName !== newName ? (
          <>
            <span className="text-muted-foreground/60">{oldName}</span>
            <span className="text-muted-foreground/50">{" → "}</span>
            <span className="text-foreground/80">{newName}</span>
          </>
        ) : (
          displayName
        )}
      </span>
      {showStats && (additions > 0 || deletions > 0) && (
        <DiffViewerStats additions={additions} deletions={deletions} />
      )}
      {copyable && copyText && (
        <button
          type="button"
          aria-label={`Copy diff of ${displayName}`}
          onClick={() => copyToClipboard(copyText)}
          className="text-muted-foreground hover:text-foreground grid size-6 shrink-0 place-items-center rounded-sm transition-colors motion-reduce:transition-none"
        >
          {isCopied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

interface DiffViewerLineProps extends ComponentProps<"div"> {
  line: ParsedLine;
  showLineNumbers?: boolean | undefined;
  searchSelection?: DiffSearchSelection | undefined;
}

function DiffViewerLine({
  line,
  showLineNumbers = true,
  searchSelection,
  className,
  ...props
}: DiffViewerLineProps) {
  const lineNumber =
    searchSelection?.side === "original"
      ? line.oldLineNumber
      : line.newLineNumber;
  const selected =
    searchSelection !== undefined &&
    lineNumber === searchSelection.line &&
    (line.type === "normal" ||
      (searchSelection.side === "original" && line.type === "del") ||
      (searchSelection.side === "modified" && line.type === "add"));
  const indicator =
    line.type === "add"
      ? "+"
      : line.type === "del"
        ? "-"
        : line.type === "marker"
          ? ""
          : " ";

  return (
    <div
      data-slot="diff-viewer-line"
      data-type={line.type}
      data-search-result={selected ? searchSelection.side : undefined}
      className={cn(
        diffLineVariants({ type: line.type }),
        selected && "relative z-10 outline outline-2 outline-amber-400/80",
        className,
      )}
      {...props}
    >
      {showLineNumbers && (
        <span
          data-slot="diff-viewer-line-number"
          className="text-muted-foreground/40 w-10 shrink-0 px-2 text-end tabular-nums select-none"
        >
          {line.type === "marker"
            ? ""
            : line.type === "del"
              ? line.oldLineNumber
              : line.type === "add"
                ? line.newLineNumber
                : line.oldLineNumber}
        </span>
      )}
      <span
        data-slot="diff-viewer-indicator"
        className={cn(
          "w-4 shrink-0 text-center select-none",
          diffLineTextVariants({ type: line.type }),
        )}
      >
        {indicator}
      </span>
      <span
        data-slot="diff-viewer-content"
        className="flex-1 pe-3.5 break-all whitespace-pre-wrap"
      >
        {renderDiffLineContent(
          line,
          selected
            ? { start: searchSelection.column, length: searchSelection.length }
            : undefined,
        )}
      </span>
    </div>
  );
}

function renderDiffLineContent(
  line: ParsedLine | null | undefined,
  matchRange?: { start: number; length: number } | undefined,
) {
  if (!line) return "";
  const segments =
    line.charSegments && line.charSegments.length > 0
      ? line.charSegments
      : [{ text: line.content, type: "normal" as const }];
  let offset = 0;

  return segments.flatMap((segment, segmentIndex) => {
    const segmentStart = offset;
    const segmentEnd = offset + segment.text.length;
    offset = segmentEnd;
    const cuts = [segmentStart, segmentEnd];
    if (matchRange) {
      const matchStart = Math.max(segmentStart, matchRange.start);
      const matchEnd = Math.min(segmentEnd, matchRange.start + matchRange.length);
      if (matchStart < matchEnd) cuts.push(matchStart, matchEnd);
    }
    cuts.sort((left, right) => left - right);

    return cuts.slice(0, -1).map((partStart, partIndex) => {
      const partEnd = cuts[partIndex + 1];
      if (partEnd === undefined || partStart === partEnd) return null;
      const text = segment.text.slice(partStart - segmentStart, partEnd - segmentStart);
      const isMatch =
        matchRange !== undefined &&
        partStart >= matchRange.start &&
        partEnd <= matchRange.start + matchRange.length;
      const isWhitespace = /^\s+$/.test(text);
      const content = isMatch ? (
        <mark className="rounded-sm bg-amber-300 text-black dark:bg-amber-400 dark:text-black">
          {text}
        </mark>
      ) : (
        text
      );

      return (
        <span
          key={`${segmentIndex}-${partIndex}`}
          className={cn(
            segment.type === "del" &&
              "bg-red-500/25 text-red-700 dark:bg-red-500/35 dark:text-red-200 rounded-[2px] font-semibold",
            segment.type === "add" &&
              "bg-green-500/25 text-green-700 dark:bg-green-500/35 dark:text-green-200 rounded-[2px] font-semibold",
            segment.type !== "normal" && isWhitespace && "inline-block min-w-[0.5ch]",
          )}
        >
          {content}
        </span>
      );
    });
  });
}

interface DiffViewerSplitLineProps extends ComponentProps<"div"> {
  pair: SplitLinePair;
  showLineNumbers?: boolean | undefined;
  searchSelection?: DiffSearchSelection | undefined;
}

function DiffViewerSplitLine({
  pair,
  showLineNumbers = true,
  searchSelection,
  className,
  ...props
}: DiffViewerSplitLineProps) {
  const { left, right } = pair;
  const leftSelected =
    searchSelection?.side === "original" &&
    left?.oldLineNumber === searchSelection.line;
  const rightSelected =
    searchSelection?.side === "modified" &&
    right?.newLineNumber === searchSelection.line;

  return (
    <div
      data-slot="diff-viewer-split-line"
      className={cn("flex", className)}
      {...props}
    >
      <div
        data-slot="diff-viewer-split-left"
        data-type={left?.type ?? "empty"}
        data-search-result={leftSelected ? "original" : undefined}
        className={cn(
          "border-foreground/10 flex w-1/2 border-e",
          diffLineVariants({ type: left?.type ?? "empty" }),
          leftSelected && "relative z-10 outline outline-2 outline-amber-400/80",
        )}
      >
        {showLineNumbers && (
          <span className="text-muted-foreground/40 w-10 shrink-0 px-2 text-end tabular-nums select-none">
            {left?.oldLineNumber ?? ""}
          </span>
        )}
        <span
          className={cn(
            "w-4 shrink-0 text-center select-none",
            diffLineTextVariants({ type: left?.type ?? "empty" }),
          )}
        >
          {left
            ? left.type === "del"
              ? "-"
              : left.type === "marker"
                ? ""
                : " "
            : ""}
        </span>
        <span className="flex-1 pe-3.5 break-all whitespace-pre-wrap">
          {renderDiffLineContent(
            left,
            leftSelected
              ? { start: searchSelection.column, length: searchSelection.length }
              : undefined,
          )}
        </span>
      </div>
      <div
        data-slot="diff-viewer-split-right"
        data-type={right?.type ?? "empty"}
        data-search-result={rightSelected ? "modified" : undefined}
        className={cn(
          "flex w-1/2",
          diffLineVariants({ type: right?.type ?? "empty" }),
          rightSelected && "relative z-10 outline outline-2 outline-amber-400/80",
        )}
      >
        {showLineNumbers && (
          <span className="text-muted-foreground/40 w-10 shrink-0 px-2 text-end tabular-nums select-none">
            {right?.newLineNumber ?? ""}
          </span>
        )}
        <span
          className={cn(
            "w-4 shrink-0 text-center select-none",
            diffLineTextVariants({ type: right?.type ?? "empty" }),
          )}
        >
          {right
            ? right.type === "add"
              ? "+"
              : right.type === "marker"
                ? ""
                : " "
            : ""}
        </span>
        <span className="flex-1 pe-3.5 break-all whitespace-pre-wrap">
          {renderDiffLineContent(
            right,
            rightSelected
              ? { start: searchSelection.column, length: searchSelection.length }
              : undefined,
          )}
        </span>
      </div>
    </div>
  );
}

interface DiffViewerFileContentProps {
  file: ParsedFile;
  splitLinePairs: SplitLinePair[];
  viewMode: "split" | "unified";
  showLineNumbers: boolean;
  showIcon: boolean;
  showStats: boolean;
  copyable: boolean;
  maxCollapsedLines: number | undefined;
  searchSelection: DiffSearchSelection | undefined;
}

function DiffViewerFileContent({
  file,
  splitLinePairs,
  viewMode,
  showLineNumbers,
  showIcon,
  showStats,
  copyable,
  maxCollapsedLines,
  searchSelection,
}: DiffViewerFileContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const renderedLineCount =
    viewMode === "split" ? splitLinePairs.length : file.lines.length;
  const isCollapsible =
    maxCollapsedLines !== undefined &&
    maxCollapsedLines >= 0 &&
    renderedLineCount > maxCollapsedLines;
  const isCollapsed = isCollapsible && !isExpanded;
  const visibleLineCount = isCollapsed ? maxCollapsedLines : renderedLineCount;

  return (
    <DiffViewerFile className="border-foreground/10 [contain-intrinsic-size:auto_240px] [content-visibility:auto] not-first:border-t">
      <DiffViewerHeader
        oldName={file.oldName}
        newName={file.newName}
        additions={file.additions}
        deletions={file.deletions}
        showIcon={showIcon}
        showStats={showStats}
        copyText={formatUnifiedDiff(file)}
        copyable={copyable}
      />
      <DiffViewerContent id={contentId} className="py-2">
        {viewMode === "split"
          ? splitLinePairs
              .slice(0, visibleLineCount)
              .map((pair, pairIndex) => (
                <DiffViewerSplitLine
                  key={pairIndex}
                  pair={pair}
                  showLineNumbers={showLineNumbers}
                  searchSelection={searchSelection}
                />
              ))
          : file.lines
              .slice(0, visibleLineCount)
              .map((line, lineIndex) => (
                <DiffViewerLine
                  key={lineIndex}
                  line={line}
                  showLineNumbers={showLineNumbers}
                  searchSelection={searchSelection}
                />
              ))}
      </DiffViewerContent>
      {isCollapsible && (
        <div className="border-foreground/10 flex border-t px-3.5 py-1.5">
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors motion-reduce:transition-none"
          >
            {isCollapsed ? `Show all ${renderedLineCount} lines` : "Show less"}
          </button>
        </div>
      )}
    </DiffViewerFile>
  );
}

interface DiffEditablePaneProps {
  /** Which side of the diff this pane represents. */
  side: DiffEditableSide;
  /** The full text for this side (the source of truth / editable value). */
  value: string;
  /** The counterpart text, used to compute the character/line diff coloring. */
  counterpart: string;
  /** Called with the new full text whenever the user edits this pane. */
  onChange: (next: string) => void;
  placeholder?: string | undefined;
  searchSelection?:
    | { start: number; length: number; line: number; column: number; token: number }
    | undefined;
}

/**
 * An editable pane that keeps the diff color-coding visible while the user
 * types directly into it.
 *
 * Technique: a fully transparent <textarea> (visible caret, transparent text)
 * is layered exactly on top of a read-only, color-coded rendering of the same
 * text. Both layers share identical typography, padding and wrapping, so the
 * caret and selection line up with the highlighted characters underneath.
 */
function DiffEditablePane({
  side,
  value,
  counterpart,
  onChange,
  placeholder,
  searchSelection,
}: DiffEditablePaneProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncHighlight = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;

    highlight.style.width = `${Math.max(textarea.scrollWidth, textarea.clientWidth)}px`;
    highlight.style.transform = `translateX(-${textarea.scrollLeft}px)`;
  }, []);

  // Compute per-line char segments for THIS side by diffing against the
  // counterpart. We reuse computeDiff and then keep only the lines that belong
  // to this side (old -> del/normal, new -> add/normal).
  const lines = useMemo<ParsedLine[]>(() => {
    const oldText = side === "old" ? value : counterpart;
    const newText = side === "old" ? counterpart : value;
    const { lines } = computeDiff(oldText, newText);
    const keepType = side === "old" ? "del" : "add";
    const picked = lines.filter(
      (l) => l.type === keepType || l.type === "normal",
    );

    return value.split(/\r\n|\r|\n/).map((content, index) => {
      const diffLine = picked[index];
      return diffLine?.content === content
        ? diffLine
        : {
            type: "normal" as DiffLineType,
            content,
            charSegments: [{ text: content, type: "normal" as const }],
          };
    });
  }, [side, value, counterpart]);

  const sharedTypography =
    "m-0 font-mono text-[12.5px] leading-[20px] whitespace-pre break-normal [font-variant-ligatures:none] px-3.5 py-3";

  useLayoutEffect(() => {
    syncHighlight();
  }, [syncHighlight, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new ResizeObserver(syncHighlight);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [syncHighlight]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !searchSelection) return;
    textarea.focus();
    textarea.setSelectionRange(
      searchSelection.start,
      searchSelection.start + searchSelection.length,
    );
    textarea.scrollTop = Math.max(
      0,
      (value.slice(0, searchSelection.start).split(/\r\n|\r|\n/).length - 1) *
        20 -
        textarea.clientHeight / 2,
    );
  }, [searchSelection, value]);

  return (
    <div className="relative flex-1 min-h-[240px] overflow-hidden">
      {/* Colored, read-only layer (underneath) */}
      <div
        ref={highlightRef}
        aria-hidden="true"
        data-slot="diff-editable-highlight"
        className={cn(sharedTypography, "relative min-h-[240px] pointer-events-none select-none")}
      >
        {lines.length === 0 ? (
          <span className="text-muted-foreground/60">{placeholder}</span>
        ) : (
          lines.map((line, idx) => (
            <div
              key={idx}
              data-type={line.type}
              data-search-result={
                searchSelection?.line === idx + 1
                  ? side === "old"
                    ? "original"
                    : "modified"
                  : undefined
              }
              className={cn(
                "-mx-3.5 px-3.5",
                "w-full",
                "min-h-[20px]",
                diffLineVariants({ type: line.type }),
                diffLineTextVariants({ type: line.type }),
                searchSelection?.line === idx + 1 &&
                  "bg-amber-300/20 outline outline-1 outline-amber-400/80",
                "block",
              )}
            >
              {renderDiffLineContent(
                line,
                searchSelection?.line === idx + 1
                  ? {
                      start: searchSelection.column,
                      length: searchSelection.length,
                    }
                  : undefined,
              ) || "\u200b"}
            </div>
          ))
        )}
      </div>

      {/* Transparent editable layer (on top) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncHighlight}
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          sharedTypography,
          "absolute inset-0 h-full w-full resize-none overflow-x-auto overflow-y-hidden border-0 bg-transparent text-transparent caret-foreground outline-none",
          "placeholder:text-transparent",
        )}
      />
    </div>
  );
}

export type DiffViewerProps = Partial<SyntaxHighlighterProps> &
  VariantProps<typeof diffViewerVariants> & {
    patch?: string | undefined;
    oldFile?: { content: string; name?: string | undefined } | undefined;
    newFile?: { content: string; name?: string | undefined } | undefined;
    viewMode?: "split" | "unified" | undefined;
    showLineNumbers?: boolean | undefined;
    showIcon?: boolean | undefined;
    showStats?: boolean | undefined;
    copyable?: boolean | undefined;
    maxCollapsedLines?: number | undefined;
    className?: string | undefined;
    searchSelection?: DiffSearchSelection | undefined;
  };

function DiffViewer({
  code,
  patch,
  oldFile,
  newFile,
  viewMode = "unified",
  showLineNumbers = true,
  showIcon = false,
  showStats = true,
  copyable = true,
  maxCollapsedLines,
  searchSelection,
  variant,
  size,
  className,
}: DiffViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const diffPatch = patch ?? code;
  const oldContent = oldFile?.content;
  const oldName = oldFile?.name;
  const newContent = newFile?.content;
  const newName = newFile?.name;

  const parsedFiles = useMemo<ParsedFile[]>(() => {
    if (diffPatch) {
      return parsePatch(diffPatch);
    }
    if (oldContent !== undefined && newContent !== undefined) {
      const { lines, hunks, additions, deletions } = computeDiff(
        oldContent,
        newContent,
      );
      return [
        {
          oldName,
          newName,
          lines,
          hunks,
          additions,
          deletions,
        },
      ];
    }
    return [];
  }, [diffPatch, oldContent, oldName, newContent, newName]);

  const splitLinePairs = useMemo<SplitLinePair[][]>(() => {
    if (viewMode !== "split") return [];
    return parsedFiles.map((file) => pairLinesForSplit(file.lines));
  }, [parsedFiles, viewMode]);

  useEffect(() => {
    if (!searchSelection) return;
    const target = viewerRef.current?.querySelector<HTMLElement>(
      `[data-search-result="${searchSelection.side}"]`,
    );
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [searchSelection, viewMode, parsedFiles]);

  if (parsedFiles.length === 0) {
    return (
      <pre
        data-slot="diff-viewer"
        className={cn(
          "border-foreground/10 bg-foreground/[0.025] dark:bg-foreground/[0.04] text-muted-foreground border px-3.5 py-3 font-mono text-xs",
          className,
        )}
      >
        No diff content provided
      </pre>
    );
  }

  return (
    <div
      data-slot="diff-viewer"
      data-view-mode={viewMode}
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      ref={viewerRef}
      className={cn(diffViewerVariants({ variant, size }), className)}
    >
      {parsedFiles.map((file, fileIndex) => (
        <DiffViewerFileContent
          key={fileIndex}
          file={file}
          splitLinePairs={splitLinePairs[fileIndex] ?? []}
          viewMode={viewMode}
          showLineNumbers={showLineNumbers}
          showIcon={showIcon}
          showStats={showStats}
          copyable={copyable}
          maxCollapsedLines={maxCollapsedLines}
          searchSelection={searchSelection}
        />
      ))}
    </div>
  );
}

DiffViewer.displayName = "DiffViewer";

export type { ParsedLine, ParsedFile, SplitLinePair };

export {
  DiffViewer,
  DiffEditablePane,
  DiffViewerFile,
  DiffViewerHeader,
  DiffViewerContent,
  DiffViewerLine,
  DiffViewerSplitLine,
  DiffViewerFileBadge,
  DiffViewerStats,
  diffViewerVariants,
  diffLineVariants,
  diffLineTextVariants,
  parsePatch,
  computeDiff,
};
