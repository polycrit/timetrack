"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectSelect } from "@/components/projects/project-select";
import { createGoal } from "@/actions/goals";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export function GoalForm({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("daily");
  const [projectId, setProjectId] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("projectId", projectId);

    // Convert hours to minutes
    const hours = parseFloat(formData.get("hours") as string) || 0;
    formData.set("targetMinutes", String(Math.round(hours * 60)));
    formData.delete("hours");

    await createGoal(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Goal</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Target (hours)</Label>
            <Input
              id="hours"
              name="hours"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="e.g. 8"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Scope</Label>
            <ProjectSelect
              projects={projects}
              value={projectId || "all"}
              onValueChange={(v) => setProjectId(v === "all" ? "" : v)}
              includeParents
              showAll
              placeholder="Overall (all projects)"
            />
          </div>
          <Button type="submit" className="w-full">
            Create Goal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
