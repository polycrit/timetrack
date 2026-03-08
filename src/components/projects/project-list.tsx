"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "./project-form";
import { deleteProject } from "@/actions/projects";
import { Pencil, Trash2, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
  _count: { timeEntries: number };
}

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProjectForm />
      </div>
      {projects.length === 0 ? (
        <Card className="retro-bevel">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Create one to organize your time entries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project, i) => (
            <Card
              key={project.id}
              className={`retro-bevel card-hover hover-actions animate-card-appear opacity-0 stagger-${Math.min(i + 1, 10)}`}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project._count.timeEntries} entries
                    </p>
                  </div>
                </div>
                <div className="action-buttons flex gap-2">
                  <ProjectForm
                    project={project}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
