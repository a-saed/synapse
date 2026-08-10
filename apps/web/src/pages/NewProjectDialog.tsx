import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { slugify, isValidProjectId } from "../lib/slugify";
import { useCreateProject } from "../api/queries";

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const createProject = useCreateProject();

  const effectiveId = idTouched ? id : slugify(name);
  const idIsValid = isValidProjectId(effectiveId);

  function reset() {
    setName("");
    setId("");
    setIdTouched(false);
  }

  async function handleCreate() {
    if (!idIsValid) return;
    try {
      await createProject.mutateAsync({ id: effectiveId, name });
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create project");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>New Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-id">Project id</Label>
            <Input
              id="project-id"
              value={effectiveId}
              onChange={(e) => {
                setIdTouched(true);
                setId(e.target.value);
              }}
            />
            {!idIsValid && effectiveId.length > 0 && (
              <p className="text-sm text-destructive">
                Only letters, digits, underscore and dash are allowed.
              </p>
            )}
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name || !idIsValid || createProject.isPending}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
