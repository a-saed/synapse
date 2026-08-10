import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";

export interface CommandAction {
  id: string;
  label: string;
  run: () => void;
}

export function CommandPalette({ actions }: { actions: CommandAction[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent>
        <Input
          autoFocus
          placeholder="Type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-3 space-y-1">
          {filtered.map((action) => (
            <li key={action.id}>
              <button
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  action.run();
                  setOpen(false);
                  setQuery("");
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
