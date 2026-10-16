import { useState } from "react";
import { Link } from "./Link";
import { usePath } from "../lib/router";
import {
  GitCompare,
  BookOpen,
  HelpCircle,
  Sun,
  Moon,
  ArrowLeftRight,
  Trash2,
  RotateCcw,
  Columns2,
  Rows3,
  Edit3,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export interface AppSidebarProps {
  mode?: "edit" | "diff";
  onModeChange?: (mode: "edit" | "diff") => void;
  diffViewMode?: "split" | "unified";
  onDiffViewModeChange?: (mode: "split" | "unified") => void;
  onClear?: () => void;
  onSwap?: () => void;
  onResetSample?: () => void;
  onEnterDiff?: () => void;
  diffEditable?: boolean;
  onToggleDiffEditable?: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export function AppSidebar({
  mode,
  onModeChange,
  diffViewMode = "split",
  onDiffViewModeChange,
  onClear,
  onSwap,
  onResetSample,
  onEnterDiff,
  diffEditable = false,
  onToggleDiffEditable,
  dark = false,
  onToggleDark,
}: AppSidebarProps) {
  const currentPath = usePath();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTool = currentPath === "/" || currentPath === "";
  const isFaq = currentPath === "/faq";
  const isBlog = currentPath.startsWith("/blog");

  const handleDiffClick = () => {
    try {
      localStorage.setItem("dv_has_entered_diff", "true");
    } catch {
      /* ignore */
    }
    onEnterDiff?.();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <Link
          to="/"
          onClick={handleDiffClick}
          className="flex items-center gap-2.5 font-bold text-foreground"
        >
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <GitCompare className="size-4" />
          </div>
          <span className="font-semibold text-base tracking-tight">
            DiffViewer
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Toggle theme"
            className="size-8 inline-flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            className="size-8 inline-flex items-center justify-center rounded-md border border-border bg-background text-foreground cursor-pointer"
          >
            {mobileOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar (Desktop fixed left, mobile slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-sidebar-border/70 flex items-center justify-between">
          <Link
            to="/"
            onClick={handleDiffClick}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <GitCompare className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-sidebar-foreground leading-none">
                DiffViewer
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                Modern Diff Checker
              </span>
            </div>
          </Link>

          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border">
            Free
          </span>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Navigation */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            <nav className="space-y-1">
              <Link
                to="/"
                onClick={handleDiffClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isTool
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <GitCompare className="size-4" />
                <span>Diff Tool</span>
              </Link>

              <Link
                to="/faq"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isFaq
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <HelpCircle className="size-4" />
                <span>FAQ</span>
              </Link>

              <Link
                to="/blog"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isBlog
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <BookOpen className="size-4" />
                <span>Blog &amp; Guides</span>
              </Link>
            </nav>
          </div>

          {/* Diff Controls (shown on Tool Page) */}
          {isTool && onModeChange && (
            <div className="space-y-4 pt-3 border-t border-sidebar-border/70">
              {/* Mode Switcher */}
              <div className="hidden md:block ">
                <label className="block px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  View Mode
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-sidebar-accent/60 rounded-lg border border-sidebar-border/60">
                  <button
                    type="button"
                    onClick={() => onModeChange("edit")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                    onClick={() => {
                      onModeChange("diff");
                      handleDiffClick();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      mode === "diff"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GitCompare className="size-3.5" />
                    <span>Diff</span>
                  </button>
                </div>
              </div>

              {/* Diff Display Layout (Split vs Unified) */}
              {mode === "diff" && onDiffViewModeChange && (
                <div className="hidden md:block">
                  <label className="block px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Diff Layout
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-sidebar-accent/60 rounded-lg border border-sidebar-border/60">
                    <button
                      type="button"
                      disabled={diffEditable}
                      onClick={() => onDiffViewModeChange("split")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        diffViewMode === "split"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <Columns2 className="size-3.5" />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      disabled={diffEditable}
                      onClick={() => onDiffViewModeChange("unified")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        diffViewMode === "unified"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <Rows3 className="size-3.5" />
                      <span>Unified</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-2">
                <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </div>
                <div className="space-y-1">
                  {mode === "diff" && onToggleDiffEditable && (
                    <div className="hidden md:block">
                      <button
                        type="button"
                        onClick={onToggleDiffEditable}
                        aria-pressed={diffEditable}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          diffEditable
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Edit3 className="size-3.5" />
                          <span>Diff Editor</span>
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                            diffEditable
                              ? "bg-primary/15 border-primary/30 text-primary"
                              : "bg-sidebar-accent border-sidebar-border text-muted-foreground"
                          }`}
                        >
                          {diffEditable ? "On" : "Off"}
                        </span>
                      </button>
                    </div>
                  )}

                  {onSwap && (
                    <button
                      type="button"
                      onClick={onSwap}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="size-3.5" />
                      <span>Swap Sides</span>
                    </button>
                  )}

                  {onResetSample && (
                    <button
                      type="button"
                      onClick={onResetSample}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reset Sample Code</span>
                    </button>
                  )}

                  {onClear && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Clear All Text</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border/70 space-y-2">
          {/* Privacy Note */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-sidebar-accent/50 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-green-500 shrink-0" />
            <span>100% Client-Side Private</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleDark}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-sidebar-accent/60 text-sidebar-foreground hover:bg-sidebar-accent border border-sidebar-border/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {dark ? (
                <Sun className="size-3.5 text-amber-400" />
              ) : (
                <Moon className="size-3.5 text-indigo-400" />
              )}
              <span>{dark ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              {dark ? "Dark" : "Light"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
