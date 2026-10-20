import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { CodeEditorPane } from "../components/TextEditorPair";
import { useSeo } from "../hooks/useSeo";
import { useTheme } from "../hooks/useTheme";
import { SITE } from "../config/site";
import { Link } from "../components/Link";
import { navigate } from "../lib/router";
import {
  parseJsonWithError,
  formatJsonData,
  minifyJsonData,
  SAMPLE_JSON,
  type IndentType,
} from "../lib/jsonFormatter";
import { JSON_FAQS } from "../content/faqs";
import {
  Braces,
  Sparkles,
  Minimize2,
  ArrowDownAZ,
  RotateCcw,
  GitCompare,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Upload,
  Layers,
  Code2,
} from "lucide-react";

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSON);
  const [indent, setIndent] = useState<IndentType>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [viewTab, setViewTab] = useState<"both" | "input" | "output">("both");
  const { dark, toggle } = useTheme();

  // Parse input in real time
  const parseResult = useMemo(() => {
    return parseJsonWithError(inputJson);
  }, [inputJson]);

  // Compute formatted output
  const formattedOutput = useMemo(() => {
    if (!inputJson.trim()) return "";
    if (!parseResult.valid) return "";
    return formatJsonData(parseResult.data, indent, sortKeys);
  }, [inputJson, parseResult, indent, sortKeys]);

  // Compute stats
  const stats = useMemo(() => {
    const rawLen = inputJson.length;
    const formattedLen = formattedOutput.length;
    let diffPercent = 0;
    if (rawLen > 0 && formattedLen > 0) {
      diffPercent = Math.round(((formattedLen - rawLen) / rawLen) * 100);
    }
    return {
      rawLen,
      formattedLen,
      diffPercent,
    };
  }, [inputJson, formattedOutput]);

  // SEO configuration
  useSeo({
    title: "Free JSON Formatter & Validator Online – Beautify, Minify & Inspect | DiffViewer",
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
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" },
            { "@type": "ListItem", position: 2, name: "Tools", item: SITE.url + "/tools" },
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
    if (parseResult.valid && parseResult.data !== undefined) {
      const formatted = formatJsonData(parseResult.data, indent, sortKeys);
      setInputJson(formatted);
    }
  };

  const handleMinify = () => {
    if (parseResult.valid && parseResult.data !== undefined) {
      const minified = minifyJsonData(parseResult.data, sortKeys);
      setInputJson(minified);
    }
  };

  const handleLoadSample = () => {
    setInputJson(SAMPLE_JSON);
  };

  const handleClear = () => {
    setInputJson("");
  };

  const handleDownload = () => {
    const textToDownload = formattedOutput || inputJson;
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: "application/json;charset=utf-8" });
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
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setInputJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSendToDiff = () => {
    try {
      sessionStorage.setItem("dv_diff_left", inputJson);
      sessionStorage.setItem("dv_diff_right", formattedOutput || inputJson);
      sessionStorage.setItem("dv_diff_auto_mode", "diff");
    } catch {
      // ignore
    }
    navigate("/");
  };

  // Adjust viewTab on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewTab("both");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AppLayout
      dark={dark}
      onToggleDark={toggle}
      jsonIndent={indent}
      onJsonIndentChange={setIndent}
      jsonSortKeys={sortKeys}
      onToggleJsonSortKeys={() => setSortKeys((v) => !v)}
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
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Braces className="size-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight m-0">
                  JSON Formatter
                </h1>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Client-side &amp; character-accurate
                </span>
              </div>
            </div>

            {/* Quick Tool Switcher Tabs */}
            <div className="inline-flex items-center p-0.5 bg-muted rounded-lg border border-border/60 text-xs">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <GitCompare className="size-3.5" />
                <span>Diff Tool</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-background text-foreground shadow-xs">
                <Braces className="size-3.5 text-emerald-500" />
                <span>JSON Formatter</span>
              </span>
            </div>
          </div>

          {/* Responsive Action Toolbar */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Mobile View Switcher (Input vs Output tabs) */}
            <div className="inline-flex lg:hidden items-center p-1 bg-muted rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setViewTab("input")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewTab === "input"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Input
              </button>
              <button
                type="button"
                onClick={() => setViewTab("output")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewTab === "output"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Output
              </button>
              <button
                type="button"
                onClick={() => setViewTab("both")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewTab === "both"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Both
              </button>
            </div>

            {/* Indent Selector */}
            <div className="inline-flex items-center p-0.5 bg-muted rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setIndent(2)}
                className={`px-2 py-1 rounded-md font-mono transition-all cursor-pointer ${
                  indent === 2
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2sp
              </button>
              <button
                type="button"
                onClick={() => setIndent(4)}
                className={`px-2 py-1 rounded-md font-mono transition-all cursor-pointer ${
                  indent === 4
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                4sp
              </button>
              <button
                type="button"
                onClick={() => setIndent("tab")}
                className={`px-2 py-1 rounded-md font-mono transition-all cursor-pointer ${
                  indent === "tab"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                tab
              </button>
            </div>

            {/* Sort Keys Toggle */}
            <button
              type="button"
              onClick={() => setSortKeys((v) => !v)}
              title="Sort object keys alphabetically"
              aria-pressed={sortKeys}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                sortKeys
                  ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                  : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownAZ className="size-3.5" />
              <span className="hidden sm:inline">Sort Keys</span>
            </button>

            {/* Load Sample Button */}
            <button
              type="button"
              onClick={handleLoadSample}
              title="Load sample JSON"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Sample</span>
            </button>

            {/* Format Button */}
            <button
              type="button"
              onClick={handleFormat}
              disabled={!parseResult.valid || !inputJson.trim()}
              title="Format and beautify JSON"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>Format</span>
            </button>

            {/* Minify Button */}
            <button
              type="button"
              onClick={handleMinify}
              disabled={!parseResult.valid || !inputJson.trim()}
              title="Minify JSON (remove whitespace)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minimize2 className="size-3.5" />
              <span className="hidden md:inline">Minify</span>
            </button>

            {/* Compare in Diff Tool Button */}
            <button
              type="button"
              onClick={handleSendToDiff}
              disabled={!inputJson.trim()}
              title="Send to Diff Tool to compare raw vs formatted side by side"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <GitCompare className="size-3.5 text-primary" />
              <span className="hidden lg:inline">Compare in Diff</span>
            </button>
          </div>
        </div>

        {/* Status / Validation Summary Bar */}
        <div className="px-3 sm:px-6 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {!inputJson.trim() ? (
              <span className="text-muted-foreground">Ready for JSON input</span>
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
                    {parseResult.error.column ? `, Col ${parseResult.error.column}` : ""})
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
            {stats.rawLen > 0 && <span>Raw: {stats.rawLen.toLocaleString()} B</span>}
            {stats.formattedLen > 0 && (
              <>
                <span>Formatted: {stats.formattedLen.toLocaleString()} B</span>
                {stats.diffPercent !== 0 && (
                  <span
                    className={
                      stats.diffPercent > 0
                        ? "text-amber-500 font-semibold"
                        : "text-emerald-500 font-semibold"
                    }
                  >
                    ({stats.diffPercent > 0 ? `+${stats.diffPercent}%` : `${stats.diffPercent}%`})
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Work Area: Two-Pane Setup */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 bg-background min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 h-full">
            {/* Left Pane: Raw JSON Input */}
            <div
              className={`flex flex-col h-full ${
                viewTab === "output" ? "hidden lg:flex" : "flex"
              }`}
            >
              <CodeEditorPane
                title="Input JSON"
                subTitle="Raw / Editable"
                value={inputJson}
                onChange={setInputJson}
                placeholder="Paste or type raw JSON here..."
                errorLine={parseResult.error?.line}
                extraHeaderActions={
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
                }
                footer={
                  !parseResult.valid && parseResult.error ? (
                    <div className="p-3 bg-destructive/10 border-t border-destructive/20 text-xs space-y-1.5 font-mono">
                      <div className="flex items-start gap-2 text-destructive font-semibold">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span className="leading-snug">{parseResult.error.message}</span>
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
            </div>

            {/* Right Pane: Formatted Output */}
            <div
              className={`flex flex-col h-full ${
                viewTab === "input" ? "hidden lg:flex" : "flex"
              }`}
            >
              <CodeEditorPane
                title="Formatted JSON"
                subTitle={
                  !inputJson.trim()
                    ? "Output"
                    : parseResult.valid
                    ? `${indent === "tab" ? "Tab" : `${indent}-Space`} Indent`
                    : "Awaiting valid input"
                }
                value={formattedOutput}
                onChange={() => {}}
                placeholder={
                  !parseResult.valid
                    ? "Fix syntax errors in Input to view formatted output..."
                    : "Formatted JSON output will appear here..."
                }
                readOnly={true}
                statusBadge={
                  formattedOutput ? (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                      Beautified
                    </span>
                  ) : null
                }
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!formattedOutput}
                    title="Download formatted JSON file"
                    className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="size-3.5" />
                  </button>
                }
              />
            </div>
          </div>
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
                Online JSON Formatter &amp; Validator – Private, Fast &amp; Accurate
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Beautify nested payloads, strip whitespace with minification, recursively sort object
                keys, and instantly pinpoint syntax errors. Everything runs 100% inside your browser
                for zero data exposure.
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
                  Choose between 2 spaces, 4 spaces, or tab indentation to match your codebase styling.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                  <Layers className="size-4" />
                  <span>Recursive Key Sorting</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Order object keys alphabetically without reordering arrays for deterministic, reliable diffs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Code2 className="size-4" />
                  <span>Diff Tool Integration</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Easily send raw and formatted JSON directly to DiffViewer to inspect differences line by line.
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
                    <div className="font-medium text-xs text-foreground">{f.q}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
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
