import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "../components/AppLayout";
import { ToolSwitcher } from "../components/ToolSwitcher";
import { SearchResultsPanel, SearchToolbar } from "../components/SearchToolbar";
import type { MobileHeaderAction } from "../components/MobileActionsMenu";
import { CodeEditorPane } from "../components/TextEditorPair";
import { useSeo } from "../hooks/useSeo";
import { useTheme } from "../hooks/useTheme";
import { SITE } from "../config/site";
import { JSON_FAQS } from "../content/faqs";
import { findTextMatches } from "../lib/utils";
import {
  Sparkles,
  Minimize2,
  ArrowDownAZ,
  RotateCcw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Upload,
  Layers,
  Code2,
} from "lucide-react";

interface JsonParseResult {
  valid: boolean;
  data?: unknown;
  error?: {
    message: string;
    line?: number;
    column?: number;
    start?: number;
    length?: number;
    excerpt?: string;
  };
}

interface FileUploadStatus {
  kind: "success" | "error";
  message: string;
  fileName?: string;
}

type IndentType = 2 | 4 | "tab" | 1;

const SAMPLE_JSON = `{
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
}`;

function parseJsonWithError(raw: string): JsonParseResult {
  if (!raw.trim()) {
    return { valid: true, data: null };
  }

  try {
    return { valid: true, data: JSON.parse(raw) };
  } catch (err: unknown) {
    let message = err instanceof Error ? err.message : String(err);
    let line: number | undefined;
    let column: number | undefined;
    let errorPosition: number | undefined;

    let inString = false;
    let escaped = false;
    for (let index = 0; index < raw.length; index += 1) {
      const character = raw[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === ",") {
        let nextIndex = index + 1;
        while (/\s/.test(raw[nextIndex] ?? "")) nextIndex += 1;
        if (raw[nextIndex] === "}" || raw[nextIndex] === "]") {
          errorPosition = index;
          message = `Trailing comma before "${raw[nextIndex]}" is not allowed in JSON.`;
          break;
        }
      }
    }

    if (errorPosition !== undefined) {
      const precedingLines = raw.slice(0, errorPosition).split("\n");
      line = precedingLines.length;
      column = precedingLines[precedingLines.length - 1].length + 1;
    } else {
      const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
      if (lineColumnMatch) {
        line = Number(lineColumnMatch[1]);
        column = Number(lineColumnMatch[2]);
      } else {
        const positionMatch = message.match(/position\s+(\d+)/i);
        if (positionMatch) {
          errorPosition = Number(positionMatch[1]);
          const beforeError = raw.slice(0, errorPosition);
          const precedingLines = beforeError.split("\n");
          line = precedingLines.length;
          column = precedingLines[precedingLines.length - 1].length + 1;
        } else {
          const lineMatch = message.match(/line\s+(\d+)/i);
          if (lineMatch) line = Number(lineMatch[1]);
        }
      }
    }

    if (
      errorPosition === undefined &&
      line !== undefined &&
      column !== undefined
    ) {
      errorPosition =
        raw
          .split("\n")
          .slice(0, line - 1)
          .join("\n").length +
        (line > 1 ? 1 : 0) +
        column -
        1;
    }

    let excerpt: string | undefined;
    if (line !== undefined) {
      const sourceLine = raw.split("\n")[line - 1] ?? "";
      excerpt =
        column !== undefined
          ? `${sourceLine}\n${" ".repeat(Math.max(0, column - 1))}^`
          : sourceLine;
    }

    return {
      valid: false,
      error: {
        message,
        line,
        column,
        start: errorPosition,
        length:
          errorPosition !== undefined && errorPosition < raw.length ? 1 : 0,
        excerpt,
      },
    };
  }
}

function stringifyJsonData(
  data: unknown,
  indent: IndentType | 0,
  sortKeys: boolean,
  sortOrder: "asc" | "desc" | null = "asc",
): string {
  const indentation = indent === "tab" ? "\t" : " ".repeat(indent);

  const stringify = (value: unknown, depth: number): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      const items = value.map((item) => stringify(item, depth + 1));
      if (!indentation) return `[${items.join(",")}]`;
      return `[\n${indentation.repeat(depth + 1)}${items.join(
        `,\n${indentation.repeat(depth + 1)}`,
      )}\n${indentation.repeat(depth)}]`;
    }

    if (value !== null && typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      if (sortKeys) {
        keys.sort((left, right) =>
          sortOrder !== "desc"
            ? left.localeCompare(right)
            : right.localeCompare(left),
        );
      }
      if (keys.length === 0) return "{}";
      const properties = keys.map((key) => {
        const property = `${JSON.stringify(key)}${
          indentation ? ": " : ":"
        }${stringify((value as Record<string, unknown>)[key], depth + 1)}`;
        return indentation
          ? `${indentation.repeat(depth + 1)}${property}`
          : property;
      });
      if (!indentation) return `{${properties.join(",")}}`;
      return `{\n${properties.join(`,\n`)}\n${indentation.repeat(depth)}}`;
    }

    return JSON.stringify(value) ?? "null";
  };

  return stringify(data, 0);
}

function formatJsonData(
  data: unknown,
  indent: IndentType,
  sortKeys = false,
  sortOrder: "asc" | "desc" | null = "asc",
): string {
  return stringifyJsonData(data, indent, sortKeys, sortOrder);
}

function minifyJsonData(
  data: unknown,
  sortKeys = false,
  sortOrder: "asc" | "desc" | null = "asc",
): string {
  return stringifyJsonData(data, 0, sortKeys, sortOrder);
}

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSON);
  const [indent, setIndent] = useState<IndentType>(2);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [searchSelection, setSearchSelection] = useState<
    { start: number; length: number; token: number } | undefined
  >();
  const [fileUploadStatus, setFileUploadStatus] =
    useState<FileUploadStatus | null>(null);
  const [uploadCountdown, setUploadCountdown] = useState(3);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    if (fileUploadStatus?.kind !== "success") return;
    const timeoutId = window.setTimeout(() => {
      if (uploadCountdown <= 1) {
        setFileUploadStatus(null);
      } else {
        setUploadCountdown((countdown) => countdown - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [fileUploadStatus, uploadCountdown]);

  // Parse input in real time
  const parseResult = useMemo(() => {
    return parseJsonWithError(inputJson);
  }, [inputJson]);
  const searchResults = useMemo(
    () => findTextMatches(inputJson, searchQuery),
    [inputJson, searchQuery],
  );
  const selectedSearchIndex =
    searchResults.length > 0 ? activeSearchIndex % searchResults.length : -1;

  const selectSearchResult = (index: number) => {
    const result = searchResults[index];
    if (!result) return;
    setActiveSearchIndex(index);
    setSearchSelection((current) => ({
      start: result.start,
      length: result.length,
      token: (current?.token ?? 0) + 1,
    }));
  };

  const navigateSearchResults = (direction: 1 | -1) => {
    if (!searchResults.length) return;
    const nextIndex =
      (selectedSearchIndex + direction + searchResults.length) %
      searchResults.length;
    selectSearchResult(nextIndex);
  };

  // SEO configuration
  useSeo({
    title:
      "Free JSON Formatter & Validator Online – Beautify, Minify & Inspect | DiffViewer",
    description:
      "Free online JSON formatter, validator, and minifier. Beautify JSON, sort keys, inspect syntax errors with exact line numbers, and compare changes. 100% private in your browser.",
    path: "/json-formatter",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          name: "JSON Formatter – DiffViewer",
          url: SITE.url + "/json-formatter",
          description:
            "Free online JSON formatter, validator, and minifier with character-level accuracy and client-side privacy.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@type": "FAQPage",
          mainEntity: JSON_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE.url + "/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tools",
              item: SITE.url + "/tools",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "JSON Formatter",
              item: SITE.url + "/json-formatter",
            },
          ],
        },
      ],
    },
  });

  const handleFormat = () => {
    if (!inputJson.trim() || !parseResult.valid) return;
    setInputJson(
      formatJsonData(parseResult.data, indent, sortOrder !== null, sortOrder),
    );
  };

  const handleMinify = () => {
    if (!inputJson.trim() || !parseResult.valid) return;
    setInputJson(
      minifyJsonData(parseResult.data, sortOrder !== null, sortOrder),
    );
  };

  const handleSortKeys = (order: "asc" | "desc") => {
    setSortOrder(order);
    if (inputJson.trim() && parseResult.valid) {
      setInputJson(formatJsonData(parseResult.data, indent, true, order));
    }
  };

  const handleLoadSample = () => {
    setInputJson(SAMPLE_JSON);
  };

  const handleClear = () => {
    setInputJson("");
  };

  const handleDownload = () => {
    if (!inputJson) return;
    const blob = new Blob([inputJson], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formatted.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    setFileUploadStatus(null);
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setInputJson(content);
        setUploadCountdown(3);
        setFileUploadStatus({
          kind: "success",
          message: "File uploaded successfully",
          fileName: file.name,
        });
      } else {
        setFileUploadStatus({
          kind: "error",
          message: `Could not read "${file.name}" as text.`,
        });
      }
    };
    reader.onerror = () => {
      setFileUploadStatus({
        kind: "error",
        message: `Failed to read "${file.name}". Please try again.`,
      });
    };
    try {
      reader.readAsText(file);
    } catch (error: unknown) {
      setFileUploadStatus({
        kind: "error",
        message:
          error instanceof Error
            ? `Failed to read "${file.name}": ${error.message}`
            : `Failed to read "${file.name}". Please try again.`,
      });
    }
    e.target.value = "";
  };

  // const handleSendToDiff = () => {
  //   const formattedForDiff =
  //     inputJson.trim() && parseResult.valid
  //       ? formatJsonData(
  //           parseResult.data,
  //           indent,
  //           sortOrder !== null,
  //           sortOrder,
  //         )
  //       : inputJson;
  //   try {
  //     sessionStorage.setItem("dv_diff_left", inputJson);
  //     sessionStorage.setItem("dv_diff_right", formattedForDiff);
  //     sessionStorage.setItem("dv_diff_auto_mode", "diff");
  //   } catch {
  //     // ignore
  //   }
  //   navigate("/");
  // };

  const mobileActions: MobileHeaderAction[] = [
    {
      label: "Format JSON",
      Icon: Sparkles,
      onSelect: handleFormat,
      disabled: !parseResult.valid || !inputJson.trim(),
    },
    {
      label: "Minify JSON",
      Icon: Minimize2,
      onSelect: handleMinify,
      disabled: !parseResult.valid || !inputJson.trim(),
    },
    {
      label: "Sort Keys A-Z",
      Icon: ArrowDownAZ,
      onSelect: () => handleSortKeys("asc"),
      active: sortOrder === "asc",
    },
    {
      label: "Sort Keys Z-A",
      Icon: ArrowDownAZ,
      onSelect: () => handleSortKeys("desc"),
      active: sortOrder === "desc",
    },
    { label: "Load Sample", Icon: RotateCcw, onSelect: handleLoadSample },
    {
      label: "Clear All",
      Icon: Trash2,
      onSelect: handleClear,
      disabled: !inputJson,
      destructive: true,
    },
  ];

  return (
    <AppLayout
      dark={dark}
      onToggleDark={toggle}
      jsonIndent={indent}
      onJsonIndentChange={setIndent}
      jsonSortOrder={sortOrder}
      onJsonSortOrderChange={handleSortKeys}
      onJsonFormat={handleFormat}
      onJsonMinify={handleMinify}
      onJsonLoadSample={handleLoadSample}
      onJsonClear={handleClear}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Sub-header Navigation and Toolbar */}
        <div className="min-h-16 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3 sm:px-6 py-3 border-b border-border bg-card/60 backdrop-blur-xs 2xl:h-16">
          {/* Tool Identifier and Tool Tabs */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <ToolSwitcher currentTool="json" actions={mobileActions} />
          </div>
        </div>

        {/* Secondary toolbar with document stats, validation, and actions */}
        <div className="px-3 sm:px-6 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 flex-wrap">
            <SearchToolbar
              open={searchOpen}
              query={searchQuery}
              resultCount={searchResults.length}
              activeIndex={selectedSearchIndex}
              placeholder="Search JSON"
              status={
                !inputJson.trim() ? (
                  <span className="text-muted-foreground">
                    Ready for JSON input
                  </span>
                ) : parseResult.valid ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-3.5" />
                    <span>Valid JSON</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/15 text-destructive border border-destructive/30">
                    <AlertCircle className="size-3.5" />
                    <span>Syntax Error</span>
                    {parseResult.error?.line && (
                      <span>
                        (Line {parseResult.error.line}
                        {parseResult.error.column
                          ? `, Col ${parseResult.error.column}`
                          : ""}
                        )
                      </span>
                    )}
                  </span>
                )
              }
              onOpenChange={setSearchOpen}
              onQueryChange={(query) => {
                setSearchQuery(query);
                setActiveSearchIndex(-1);
                setSearchSelection(undefined);
              }}
              onNavigate={navigateSearchResults}
              onClose={() => {
                setSearchOpen(false);
                setSearchQuery("");
                setSearchSelection(undefined);
              }}
            />
            {/* <button
              type="button"
              onClick={handleSendToDiff}
              disabled={!inputJson.trim()}
              title="Send to Diff Tool to compare raw vs formatted side by side"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <GitCompare className="size-3.5 text-primary" />
              <span className="hidden lg:inline">Compare in Diff</span>
            </button>  */}
          </div>
        </div>

        <SearchResultsPanel
          open={searchOpen}
          query={searchQuery}
          resultCount={searchResults.length}
        >
          {searchResults.map((result, index) => (
            <button
              key={`${result.start}-${result.value}`}
              type="button"
              role="option"
              aria-selected={selectedSearchIndex === index}
              onClick={() => selectSearchResult(index)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors ${
                selectedSearchIndex === index
                  ? "bg-primary/15 text-primary"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {result.line}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {result.value}
              </span>
              {result.fuzzy && (
                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] text-primary">
                  Closest
                </span>
              )}
            </button>
          ))}
        </SearchResultsPanel>

        {/* Single editable JSON document */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 bg-background min-h-[500px]">
          {fileUploadStatus?.kind === "success" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </span>
              <span className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-foreground">
                  {fileUploadStatus.message}
                </span>
                {fileUploadStatus.fileName && (
                  <span className="break-all text-muted-foreground">
                    {fileUploadStatus.fileName}
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Opening editor in {uploadCountdown}…
              </span>
              <button
                type="button"
                onClick={() => setFileUploadStatus(null)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span>Open Editor</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <CodeEditorPane
              title="JSON Editor"
              subTitle="Editable"
              value={inputJson}
              onChange={setInputJson}
              placeholder="Paste or type JSON here..."
              errorLine={parseResult.error?.line}
              errorColumn={parseResult.error?.column}
              errorLength={parseResult.error?.length}
              selectionRequest={searchSelection}
              editorNotice={
                fileUploadStatus?.kind === "error" ? (
                  <div
                    role="status"
                    className="mx-3 mt-3 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive sm:mx-4"
                  >
                    <AlertCircle className="size-5 shrink-0" />
                    <span className="text-xs font-medium">
                      {fileUploadStatus.message}
                    </span>
                  </div>
                ) : null
              }
              extraHeaderActions={
                <>
                  <label
                    title="Upload .json file"
                    className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <Upload className="size-3.5" />
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!inputJson}
                    title="Download current JSON"
                    aria-label="Download current JSON"
                    className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="size-3.5" />
                  </button>
                </>
              }
              footer={
                !parseResult.valid && parseResult.error ? (
                  <div className="p-3 bg-destructive/10 border-t border-destructive/20 text-xs space-y-1.5 font-mono">
                    <div className="flex items-start gap-2 text-destructive font-semibold">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {parseResult.error.message}
                        {parseResult.error.line !== undefined && (
                          <span>
                            {" "}
                            (Line {parseResult.error.line}
                            {parseResult.error.column !== undefined
                              ? `, column ${parseResult.error.column}`
                              : ""}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                    {parseResult.error.excerpt && (
                      <pre className="p-2 bg-destructive/15 text-destructive rounded overflow-x-auto text-[11px] leading-tight select-all">
                        {parseResult.error.excerpt}
                      </pre>
                    )}
                  </div>
                ) : null
              }
            />
          )}
        </div>

        {/* Informational & FAQ Section */}
        <section
          aria-label="About JSON Formatter and FAQs"
          className="border-t border-border/60 bg-muted/20 px-4 sm:px-6 py-12"
        >
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Section Header */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Online JSON Formatter &amp; Validator – Private, Fast &amp;
                Accurate
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Beautify nested payloads, strip whitespace with minification,
                recursively sort object keys, and instantly pinpoint syntax
                errors. Everything runs 100% inside your browser for zero data
                exposure.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Sparkles className="size-4" />
                  <span>Custom Formatting</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose between 2 spaces, 4 spaces, or tab indentation to match
                  your codebase styling.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                  <Layers className="size-4" />
                  <span>Recursive Key Sorting</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Order object keys alphabetically without reordering arrays for
                  deterministic, reliable diffs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Code2 className="size-4" />
                  <span>Diff Tool Integration</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Easily send raw and formatted JSON directly to DiffViewer to
                  inspect differences line by line.
                </p>
              </div>
            </div>

            {/* FAQ Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                <HelpCircle className="size-4 text-primary" />
                <h3>Frequently Asked Questions</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {JSON_FAQS.map((f) => (
                  <div
                    key={f.q}
                    className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-2xs space-y-1.5"
                  >
                    <div className="font-medium text-xs text-foreground">
                      {f.q}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
