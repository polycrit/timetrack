"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectSelect } from "@/components/projects/project-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

interface Tag {
  id: string;
  name: string;
}

interface EntryFormProps {
  projects: Project[];
  tags: Tag[];
  entry?: {
    id: string;
    description: string;
    startTime: string;
    endTime: string;
    projectId: string | null;
    tags: { tagId: string }[];
  };
  trigger?: React.ReactNode;
}

function toLocalDatetime(date: string | Date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EntryForm({ projects, tags, entry, trigger }: EntryFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(entry?.projectId ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    entry?.tags.map((t) => t.tagId) ?? []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data = {
      description: form.get("description") as string,
      startTime: new Date(form.get("startTime") as string).toISOString(),
      endTime: new Date(form.get("endTime") as string).toISOString(),
      projectId: projectId || null,
      tagIds: selectedTags,
    };

    const url = entry ? `/api/entries/${entry.id}` : "/api/entries";
    const method = entry ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : "New Entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={entry?.description ?? ""}
              placeholder="What did you work on?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                defaultValue={
                  entry ? toLocalDatetime(entry.startTime) : ""
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                defaultValue={entry ? toLocalDatetime(entry.endTime) : ""}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <ProjectSelect
              projects={projects}
              value={projectId}
              onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
              showNone
              placeholder="No project"
            />
          </div>
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                    size="xs"
                    onClick={() => toggleTag(tag.id)}
                    className="rounded-full"
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full">
            {entry ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
