"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, updateProject } from "@/actions/projects";
import { Plus } from "lucide-react";

const PRESET_COLORS = [
  "#6B8F71", "#D97706", "#C2662D", "#B07D8A", "#5B8A8A",
  "#8B6F47", "#DC5044", "#A0855B", "#7B9E6B", "#C4956A",
  "#6B7F5B", "#D4A76A",
];

interface ProjectFormProps {
  project?: { id: string; name: string; color: string; parentId?: string | null };
  trigger?: React.ReactNode;
  parentProjects?: { id: string; name: string; color: string }[];
  defaultParentId?: string;
}

export function ProjectForm({ project, trigger, parentProjects, defaultParentId }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0]);
  const [parentId, setParentId] = useState(
    project?.parentId ?? defaultParentId ?? ""
  );

  async function handleSubmit(formData: FormData) {
    formData.set("color", color);
    formData.set("parentId", parentId === "none" ? "" : parentId);
    if (project) {
      await updateProject(project.id, formData);
    } else {
      await createProject(formData);
    }
    setOpen(false);
  }

  const isSubProject = !!defaultParentId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {isSubProject ? "Add Sub-project" : "New Project"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : isSubProject ? "New Sub-project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project?.name ?? ""}
              placeholder={isSubProject ? "Sub-project name" : "Project name"}
              required
            />
          </div>
          {parentProjects && parentProjects.length > 0 && !isSubProject && (
            <div className="space-y-2">
              <Label>Parent Project</Label>
              <Select
                value={parentId || "none"}
                onValueChange={setParentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentProjects
                    .filter((p) => p.id !== project?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-sm border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "white" : "transparent",
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">
            {project ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
