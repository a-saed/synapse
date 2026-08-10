import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { getExportSnippet, exportArchiveUrl } from "../../api/projects";

export function ExportDialog({ projectId }: { projectId: string }) {
  async function copySnippet() {
    const snippet = await getExportSnippet(projectId);
    await navigator.clipboard.writeText(JSON.stringify(snippet, null, 2));
    toast.success("Claude Desktop config copied to clipboard");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Export</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export project</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <a
            href={exportArchiveUrl(projectId)}
            download
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Download standalone server (.zip)
          </a>
          <Button variant="outline" onClick={copySnippet}>
            Copy Claude Desktop config
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
