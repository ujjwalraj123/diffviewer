import { Menu } from "@base-ui/react/menu";
import { Braces, Check, ChevronDown, GitCompare } from "lucide-react";
import { navigate } from "../lib/router";
import { MobileActionsMenu, type MobileHeaderAction } from "./MobileActionsMenu";

type ToolSwitcherProps = {
  currentTool: "diff" | "json";
  actions?: MobileHeaderAction[];
};

const tools = [
  { id: "diff", label: "Online Diff Checker", path: "/", Icon: GitCompare },
  { id: "json", label: "JSON Formatter", path: "/json-formatter", Icon: Braces },
] as const;

export function ToolSwitcher({ currentTool, actions = [] }: ToolSwitcherProps) {
  const selectedTool = currentTool === "diff" ? tools[0] : tools[1];
  const SelectedIcon = selectedTool.Icon;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
          currentTool === "json"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-primary/10 text-primary"
        }`}
      >
        <SelectedIcon className="size-4" />
      </div>
      <h1 className="m-0 shrink-0 text-sm font-semibold tracking-tight text-foreground">
        <Menu.Root>
          <Menu.Trigger
            aria-label={`Select tool, current ${selectedTool.label}`}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold tracking-tight text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-sm"
          >
            <span>{selectedTool.label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="start" className="z-50 outline-none">
              <Menu.Popup className="min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
                {tools.map(({ id, label, path, Icon }) => (
                  <Menu.Item
                    key={id}
                    onClick={() => navigate(path)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    {/* <Icon className="size-3.5" /> */}
                    <span className="flex-1">{label}</span>
                    {id === currentTool && <Check className="size-3.5" />}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </h1>
      {actions.length > 0 && <MobileActionsMenu actions={actions} />}
    </div>
  );
}
