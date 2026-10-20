import { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { ToolSwitcher } from "../components/ToolSwitcher";
import { TextEditorPair } from "../components/TextEditorPair";
import { CopyButton } from "../components/CopyButton";
import { DiffViewer, DiffEditablePane } from "@/components/ui/diff-viewer";
import { useSeo } from "../hooks/useSeo";
import { useTheme } from "../hooks/useTheme";
import { SITE } from "../config/site";
import { FAQS } from "../content/faqs";
import {
  GitCompare,
  Edit3,
  Columns2,
  Rows3,
  CheckCircle2,
  HelpCircle,
  Info,
} from "lucide-react";
/*
const SAMPLE_LEFT = `function greet(name) {
  return "Hello, " + name;
}

greet("world");
`;

const SAMPLE_RIGHT = `function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

greet("world");
greet("there", "Hi");
`;
*/

export default function ToolPage() {
  const [mode, setMode] = useState<"edit" | "diff">(() => {
    try {
      if (sessionStorage.getItem("dv_diff_auto_mode") === "diff") {
        sessionStorage.removeItem("dv_diff_auto_mode");
        return "diff";
      }
    } catch {
      // ignore
    }
    return "edit";
  });
  const [diffViewMode, setDiffViewMode] = useState<"split" | "unified">("split");
  // When true, the diff view becomes editable in place (Diff Editor action).
  const [diffEditable, setDiffEditable] = useState(false);
  const [left, setLeft] = useState(() => {
    try {
      const saved = sessionStorage.getItem("dv_diff_left");
      if (saved) {
        sessionStorage.removeItem("dv_diff_left");
        return saved;
      }
    } catch {
      // ignore
    }
    return "";
  });
  const [right, setRight] = useState(() => {
    try {
      const saved = sessionStorage.getItem("dv_diff_right");
      if (saved) {
        sessionStorage.removeItem("dv_diff_right");
        return saved;
      }
    } catch {
      // ignore
    }
    return "";
  });
  const { dark, toggle } = useTheme();

  // Persistent workflow state
  const [hasEnteredDiff, setHasEnteredDiff] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dv_has_entered_diff") === "true";
    } catch {
      return false;
    }
  });

  const markEnteredDiff = () => {
    try {
      localStorage.setItem("dv_has_entered_diff", "true");
    } catch {
      // Ignore storage errors
    }
    setHasEnteredDiff(true);
  };

  const handleModeChange = (newMode: "edit" | "diff") => {
    setMode(newMode);

    if (newMode === "diff") {
      markEnteredDiff();
    }
  };

  useSeo({
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          name: SITE.name,
          url: SITE.url + "/",
          description: SITE.defaultDescription,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    },
  });

  const handleClear = () => {
    setLeft("");
    setRight("");
  };

  const handleSwap = () => {
    setLeft(right);
    setRight(left);
  };

  
  /*
  const handleResetSample = () => {
    setLeft(SAMPLE_LEFT);
    setRight(SAMPLE_RIGHT);
  };
  */

  // Treat inputs as identical when they only differ by line-ending style
  // (CRLF vs LF) or a single trailing newline — these are cosmetic and should
  // not be reported as differences (matches the diff viewer's normalization).
  const normalizeForCompare = (text: string) =>
    text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const isIdentical =
    left.length > 0 &&
    right.length > 0 &&
    normalizeForCompare(left) === normalizeForCompare(right);
  const isBothEmpty = left.trim().length === 0 && right.trim().length === 0;

  return (
    <AppLayout
      mode={mode}
      onModeChange={handleModeChange}
      diffViewMode={diffViewMode}
      onDiffViewModeChange={setDiffViewMode}
      onClear={handleClear}
      onSwap={handleSwap}
      // onResetSample={handleResetSample}
      onEnterDiff={markEnteredDiff}
      diffEditable={diffEditable}
      onToggleDiffEditable={() => setDiffEditable((v) => !v)}
      dark={dark}
      onToggleDark={toggle}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Sub-header navigation and status bar */}
        <div className="h-auto min-h-16 shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-3.5 border-b border-border bg-card/60 backdrop-blur-xs sm:h-16 sm:flex-nowrap sm:px-6">
          {/* Workspace identity and tool selector */}
          <div className="flex items-center gap-3">
            <ToolSwitcher currentTool="diff" />
          </div>

          {/* Mode switcher and responsive view controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Edit / Diff View tabs */}
            <div className="inline-flex sm:hidden items-center p-1 bg-muted rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => handleModeChange("edit")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mode === "edit"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="size-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("diff")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mode === "diff"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitCompare className="size-3.5" />
                <span>Diff View</span>
              </button>
            </div>

            {/* Mobile only: Split / Unified toggle */}
            <div className="inline-flex sm:hidden items-center p-1 bg-muted rounded-lg border border-border/60">
              <button
                type="button"
                disabled={diffEditable}
                onClick={() => setDiffViewMode("split")}
                aria-pressed={diffViewMode === "split"}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${diffViewMode === "split"  ? "bg-background text-foreground shadow-xs font-semibold"  : "text-muted-foreground hover:text-foreground"}`}
              >
                <Columns2 className="size-3.5" />
                <span>Split</span>
              </button>

              <button
                type="button"
                disabled={diffEditable}
                onClick={() => setDiffViewMode("unified")}
                aria-pressed={diffViewMode === "unified"}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${diffViewMode === "unified"  ? "bg-background text-foreground shadow-xs font-semibold"  : "text-muted-foreground hover:text-foreground"}`}
              >
                <Rows3 className="size-3.5" />
                <span>Unified</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main work area */}
        <div
          className={`flex-1 flex flex-col ${
            mode === "diff" && diffEditable ? "min-h-max" : "min-h-0"
          } bg-background`}
        >
          {mode === "edit" ? (
            <TextEditorPair
              left={left}
              right={right}
              onLeftChange={setLeft}
              onRightChange={setRight}
              dark={dark}
            />
          ) : (
            <div
              className={`p-4 md:p-6 flex flex-col gap-4 ${
                diffEditable ? "flex-none" : "flex-1"
              }`}
            >
              {diffEditable ? (
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Original (editable) */}
                  <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Edit3 className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground tracking-tight">
                          Original
                        </span>
                      </div>
                      <CopyButton text={left} />
                    </div>
                    <DiffEditablePane
                      side="old"
                      value={left}
                      counterpart={right}
                      onChange={setLeft}
                      placeholder="Original text…"
                    />
                  </div>

                  {/* Modified (editable) */}
                  <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Edit3 className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground tracking-tight">
                          Modified
                        </span>
                      </div>
                      <CopyButton text={right} />
                    </div>
                    <DiffEditablePane
                      side="new"
                      value={right}
                      counterpart={left}
                      onChange={setRight}
                      placeholder="Modified text…"
                    />
                  </div>
                </div>
              ) : isBothEmpty ? (
                <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-3">
                  <Info className="size-8 text-muted-foreground" />
                  <div className="font-semibold text-foreground text-sm">
                    No text to compare
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Both original and modified inputs are empty. Switch to Edit
                    mode to paste or write text.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleModeChange("edit")}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Go to Edit Mode</span>
                  </button>
                </div>
              ) : isIdentical ? (
                <div className="p-8 text-center rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3 shadow-xs">
                  <CheckCircle2 className="size-8 text-green-500" />
                  <div className="font-semibold text-foreground text-sm">
                    No differences found
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Both original and modified texts are completely identical.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleModeChange("edit")}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Texts</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
                  <DiffViewer
                    oldFile={{
                      content: left,
                      name: "original",
                    }}
                    newFile={{
                      content: right,
                      name: "modified",
                    }}
                    viewMode={diffViewMode}
                    showLineNumbers={true}
                    showIcon={false}
                    showStats={true}
                    copyable={true}
                    variant="default"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Initial visit FAQ section */}
        {!hasEnteredDiff && (
          <section
            aria-label="About DiffViewer and FAQs"
            className="border-t border-border/60 bg-muted/20 px-6 py-12"
          >
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Online Diff Checker – Fast, Private &amp; Character-Accurate
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  DiffViewer compares text, code, JSON, and documents side by
                  side with instant character-level highlighting. Everything
                  runs 100% in your browser for total privacy and speed.
                </p>
              </div>

              {/* FAQ cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                  <HelpCircle className="size-4 text-primary" />
                  <h3>Frequently Asked Questions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FAQS.map((f) => (
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
        )}
      </div>
    </AppLayout>
  );
}
