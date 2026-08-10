import { useEffect, useRef } from "react";
import { Wrench, FileText, MessageSquare, FolderPlus, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export type AddableKind = "tool" | "resource" | "prompt" | "group";

const ITEMS: { kind: AddableKind; label: string; icon: LucideIcon }[] = [
  { kind: "tool", label: "Tool", icon: Wrench },
  { kind: "resource", label: "Resource", icon: FileText },
  { kind: "prompt", label: "Prompt", icon: MessageSquare },
  { kind: "group", label: "Group", icon: FolderPlus },
];

export function AddMenu({
  position,
  onSelect,
  onClose,
}: {
  position: { x: number; y: number };
  onSelect: (kind: AddableKind) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: "fixed", left: position.x, top: position.y }}
      className="z-50 w-40 rounded-md border border-border bg-popover p-1 shadow-lg"
    >
      {ITEMS.map(({ kind, label, icon: Icon }) => (
        <button
          key={kind}
          type="button"
          role="menuitem"
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => onSelect(kind)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
