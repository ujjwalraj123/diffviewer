import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

interface SearchToolbarProps {
  open: boolean;
  query: string;
  resultCount: number;
  activeIndex: number;
  placeholder: string;
  status?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onNavigate: (direction: 1 | -1) => void;
  onClose: () => void;
}

export function SearchToolbar({
  open,
  query,
  resultCount,
  activeIndex,
  placeholder,
  status,
  onOpenChange,
  onQueryChange,
  onNavigate,
  onClose,
}: SearchToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange]);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">{status}</div>
      <div className="flex shrink-0 items-center gap-1">
        {open ? (
            <>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onNavigate(event.shiftKey ? -1 : 1);
                  } else if (event.key === "Escape") {
                    onClose();
                  }
                }}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-8 w-36 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-48"
              />
              <span
                aria-live="polite"
                className="min-w-10 text-center text-[10px] font-mono text-muted-foreground tabular-nums"
              >
                {query ? `${activeIndex >= 0 ? activeIndex + 1 : 0}/${resultCount}` : "0/0"}
              </span>
              <button
                type="button"
                onClick={() => onNavigate(-1)}
                disabled={!resultCount}
                title="Previous result (Shift+Enter)"
                aria-label="Previous search result"
                className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(1)}
                disabled={!resultCount}
                title="Next result (Enter)"
                aria-label="Next search result"
                className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
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
              onClick={() => onOpenChange(true)}
              title="Search (Ctrl+F)"
              aria-label="Search"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="size-3.5" />
              <span>Search</span>
              <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">
                Ctrl+F
              </span>
            </button>
        )}
      </div>
    </div>
  );
}

export function SearchResultsPanel({
  open,
  query,
  resultCount,
  children,
}: {
  open: boolean;
  query: string;
  resultCount: number;
  children: ReactNode;
}) {
  if (!open || !query) return null;
  return (
    <div
      role="listbox"
      aria-label="Search results"
      className="max-h-48 shrink-0 overflow-y-auto border-b border-border/60 bg-muted/20 px-3 py-1.5 sm:px-6"
    >
      {resultCount === 0 ? (
        <div className="px-3 py-2 text-xs text-muted-foreground" role="status">
          No results found
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">{children}</div>
      )}
    </div>
  );
}
