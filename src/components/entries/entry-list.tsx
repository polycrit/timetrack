"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntryForm } from "./entry-form";
import { formatDuration, formatDate, formatTime } from "@/lib/utils";
import { Pencil, Trash2, Clock } from "lucide-react";

interface TimeEntry {
  id: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  tags: { tagId: string; tag: { id: string; name: string } }[];
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

interface EntryListProps {
  entries: TimeEntry[];
  projects: Project[];
  tags: Tag[];
}

export function EntryList({ entries, projects, tags }: EntryListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (entries.length === 0) {
    return (
      <Card className="retro-bevel">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No time entries found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Start the timer or add one manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <Card
          key={entry.id}
          className={`retro-bevel card-hover hover-actions animate-card-appear opacity-0 stagger-${Math.min(i + 1, 10)}`}
        >
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">
                  {entry.description || "Untitled"}
                </p>
                {entry.project && (
                  <Badge
                    variant="secondary"
                    className="shrink-0"
                    style={{
                      backgroundColor: entry.project.color + "20",
                      color: entry.project.color,
                      borderColor: entry.project.color + "40",
                    }}
                  >
                    {entry.project.name}
                  </Badge>
                )}
                {entry.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="outline" className="shrink-0">
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date(entry.startTime))}{" "}
                {formatTime(new Date(entry.startTime))} -{" "}
                {formatTime(new Date(entry.endTime))}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:ml-4">
              <span className="font-mono text-sm font-medium">
                {formatDuration(entry.duration)}
              </span>
              <div className="action-buttons flex gap-1">
                <EntryForm
                  projects={projects}
                  tags={tags}
                  entry={{
                    id: entry.id,
                    description: entry.description,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    projectId: entry.projectId,
                    tags: entry.tags,
                  }}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
