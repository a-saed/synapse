import { Link } from "react-router-dom";
import { Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";
import { AppHeader } from "../components/AppHeader";
import { NewProjectDialog } from "./NewProjectDialog";
import { useProjects, useDeleteProject } from "../api/queries";
import { cn } from "../lib/cn";

export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  return (
    <div className="mx-auto max-w-4xl p-8">
      <header className="sticky top-0 z-20 -mx-8 mb-8 border-b bg-background/80 px-8 py-4 backdrop-blur">
        <AppHeader />
        <p className="mt-2 text-sm text-muted-foreground">
          A visual builder for MCP servers — compose tools, resources, and
          prompts into groups, then export a ready-to-run server.
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <NewProjectDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} data-testid="project-skeleton" className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && projects?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Workflow className="h-8 w-8" />
          <p>No projects yet — create your first one to get started.</p>
          <NewProjectDialog />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {projects?.map((project) => (
          <Card
            key={project.id}
            className="group relative transition-all hover:border-primary hover:shadow-hover"
          >
            <Link to={`/projects/${project.id}`} className="block">
              <CardHeader>
                <CardTitle className="pr-6">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {project.nodes.length} node{project.nodes.length === 1 ? "" : "s"}
                </span>
                <span className="flex gap-1">
                  {project.nodes.slice(0, 8).map((node) => (
                    <span
                      key={node.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        node.kind === "tool" && "bg-node-tool",
                        node.kind === "resource" && "bg-node-resource",
                        node.kind === "prompt" && "bg-node-prompt"
                      )}
                    />
                  ))}
                </span>
              </CardContent>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${project.name}`}
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {project.name}?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">This can&apos;t be undone.</p>
                <div className="mt-4 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant="default"
                      onClick={() =>
                        deleteProject.mutate(project.id, {
                          onError: () => toast.error("Failed to delete project"),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  );
}
