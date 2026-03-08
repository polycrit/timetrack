"use client";

import { useMemo } from "react";
import { buildProjectTree, type FlatProject } from "@/lib/project-utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectSelectProps {
  projects: FlatProject[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showNone?: boolean;
  showAll?: boolean;
  includeParents?: boolean;
  className?: string;
}

export function ProjectSelect({
  projects,
  value,
  onValueChange,
  placeholder = "Project",
  showNone = false,
  showAll = false,
  includeParents = false,
  className,
}: ProjectSelectProps) {
  const tree = useMemo(() => buildProjectTree(projects), [projects]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showNone && <SelectItem value="none">No project</SelectItem>}
        {showAll && <SelectItem value="all">All projects</SelectItem>}
        {(showNone || showAll) && tree.length > 0 && <SelectSeparator />}
        {tree.map((node) => {
          if (node.children.length === 0) {
            return (
              <SelectItem key={node.id} value={node.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  {node.name}
                </span>
              </SelectItem>
            );
          }

          return (
            <SelectGroup key={node.id}>
              {includeParents ? (
                <SelectItem value={node.id}>
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: node.color }}
                    />
                    {node.name}
                  </span>
                </SelectItem>
              ) : (
                <SelectLabel className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  {node.name}
                </SelectLabel>
              )}
              {node.children.map((child) => (
                <SelectItem key={child.id} value={child.id} className="pl-6">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: child.color }}
                    />
                    {child.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
