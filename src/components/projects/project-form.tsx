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
import { createProject, updateProject } from "@/actions/projects";
import { Plus } from "lucide-react";

const PRESET_COLORS = [
  "#6B8F71", "#D97706", "#C2662D", "#B07D8A", "#5B8A8A",
  "#8B6F47", "#DC5044", "#A0855B", "#7B9E6B", "#C4956A",
  "#6B7F5B", "#D4A76A",
];

interface ProjectFormProps {
  project?: { id: string; name: string; color: string };
  trigger?: React.ReactNode;
}

export function ProjectForm({ project, trigger }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0]);

  async function handleSubmit(formData: FormData) {
    formData.set("color", color);
    if (project) {
      await updateProject(project.id, formData);
    } else {
      await createProject(formData);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project?.name ?? ""}
              placeholder="Project name"
              required
            />
          </div>
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
