import { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { TextEditorPair } from "../components/TextEditorPair";
import { DiffViewer } from "@/components/ui/diff-viewer";
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
  FileCode2,
  Info,
} from "lucide-react";

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

export default function ToolPage() {
  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [diffViewMode, setDiffViewMode] = useState<"split" | "unified">("split");
  const [left, setLeft] = useState(SAMPLE_LEFT);
  const [right, setRight] = useState(SAMPLE_RIGHT);
  const { dark, toggle } = useTheme();

  // Persistent workflow state: track if user has ever entered the Diff workflow
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
      /* ignore */
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

  const handleResetSample = () => {
    setLeft(SAMPLE_LEFT);
    setRight(SAMPLE_RIGHT);
  };

  const isIdentical = left === right && left.length > 0;
  const isBothEmpty = left.trim().length === 0 && right.trim().length === 0;

  return (
    <AppLayout
      mode={mode}
      onModeChange={handleModeChange}
      diffViewMode={diffViewMode}
      onDiffViewModeChange={setDiffViewMode}
      onClear={handleClear}
      onSwap={handleSwap}
      onResetSample={handleResetSample}
      onEnterDiff={markEnteredDiff}
      dark={dark}
      onToggleDark={toggle}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Sub-header navigation & status bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 text-primary" />
              <h1 className="text-sm font-semibold text-foreground tracking-tight m-0">
                Diff Workspace
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="inline-flex items-center p-1 bg-muted rounded-lg border border-border/60">
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

            {/* Split / Unified toggle in diff mode */}
            {mode === "diff" && (
              <div className="hidden sm:inline-flex items-center p-1 bg-muted rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setDiffViewMode("split")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    diffViewMode === "split"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Columns2 className="size-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("unified")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    diffViewMode === "unified"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Rows3 className="size-3.5" />
                  <span>Unified</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {mode === "edit" ? (
            <TextEditorPair
              left={left}
              right={right}
              onLeftChange={setLeft}
              onRightChange={setRight}
              dark={dark}
            />
          ) : (
            <div className="flex-1 p-4 md:p-6 flex flex-col gap-4">
              {isBothEmpty ? (
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

        {/* Initial Visit FAQ Section:
            Shown by default for first-time visitors in the main Diff Viewer area.
            Once the user clicks Diff or enters the Diff workflow, this section is removed
            from the main Diff Viewer area and accessible exclusively via the sidebar FAQ link. */}
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

              {/* FAQ Cards */}
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
