import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { NewProjectDialog } from "./NewProjectDialog";
import { useProjects } from "../api/queries";

export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="mx-auto max-w-4xl p-8">
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
          <Link key={project.id} to={`/projects/${project.id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {project.nodes.length} node{project.nodes.length === 1 ? "" : "s"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
