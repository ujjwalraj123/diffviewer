import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export type MobileHeaderAction = {
  label: string;
  Icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  active?: boolean;
  destructive?: boolean;
};

export function MobileActionsMenu({ actions }: { actions: MobileHeaderAction[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-muted px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 md:hidden">
        <span>Actions</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            {actions.map(({ label, Icon, onSelect, disabled, active, destructive }) => (
              <Menu.Item
                key={label}
                onClick={onSelect}
                disabled={disabled}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground ${
                  destructive ? "text-destructive data-[highlighted]:text-destructive" : ""
                }`}
              >
                <Icon className="size-3.5" />
                <span className="flex-1">{label}</span>
                {active && <Check className="size-3.5" />}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
