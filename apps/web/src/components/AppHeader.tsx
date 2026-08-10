import { Link } from "react-router-dom";
import { Workflow } from "lucide-react";

export function AppHeader() {
  return (
    <Link
      to="/projects"
      className="flex items-center gap-2 font-semibold tracking-tight transition-colors hover:text-primary"
    >
      <Workflow className="h-5 w-5 text-primary" />
      <span>Synapse</span>
    </Link>
  );
}
