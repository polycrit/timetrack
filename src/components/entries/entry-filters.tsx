"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

export function EntryFilters({
  projects,
  tags,
}: {
  projects: Project[];
  tags: Tag[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/entries?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/entries");
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
      <div className="space-y-1 w-full sm:w-auto">
        <label className="text-sm text-muted-foreground">From</label>
        <Input
          type="date"
          value={searchParams.get("startDate") ?? ""}
          onChange={(e) => updateFilter("startDate", e.target.value)}
          className="w-full sm:w-[160px]"
        />
      </div>
      <div className="space-y-1 w-full sm:w-auto">
        <label className="text-sm text-muted-foreground">To</label>
        <Input
          type="date"
          value={searchParams.get("endDate") ?? ""}
          onChange={(e) => updateFilter("endDate", e.target.value)}
          className="w-full sm:w-[160px]"
        />
      </div>
      <div className="space-y-1 w-full sm:w-auto">
        <label className="text-sm text-muted-foreground">Project</label>
        <Select
          value={searchParams.get("projectId") ?? "all"}
          onValueChange={(v) => updateFilter("projectId", v)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tags.length > 0 && (
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-sm text-muted-foreground">Tag</label>
          <Select
            value={searchParams.get("tagId") ?? "all"}
            onValueChange={(v) => updateFilter("tagId", v)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button variant="ghost" onClick={clearFilters}>
        Clear
      </Button>
    </div>
  );
}
