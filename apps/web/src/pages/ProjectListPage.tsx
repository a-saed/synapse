import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
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

export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  return (
    <div className="mx-auto max-w-4xl p-8">
      <header className="mb-8">
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

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && projects?.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No projects yet. Create your first one to get started.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id} className="group relative transition-colors hover:border-primary">
            <Link to={`/projects/${project.id}`} className="block">
              <CardHeader>
                <CardTitle className="pr-6">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {project.nodes.length} node{project.nodes.length === 1 ? "" : "s"}
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
