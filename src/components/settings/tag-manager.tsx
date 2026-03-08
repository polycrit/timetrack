"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createTag, deleteTag } from "@/actions/tags";
import { X, Plus } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

export function TagManager({ tags }: { tags: Tag[] }) {
  const [name, setName] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    const formData = new FormData();
    formData.set("name", name.trim());
    await createTag(formData);
    setName("");
  }

  return (
    <Card className="retro-bevel">
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          )}
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pr-0.5">
              {tag.name}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => deleteTag(tag.id)}
                className="h-5 w-5 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
