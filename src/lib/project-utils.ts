export interface FlatProject {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export interface ProjectNode extends FlatProject {
  children: ProjectNode[];
}

export function buildProjectTree(projects: FlatProject[]): ProjectNode[] {
  const map = new Map<string, ProjectNode>();
  const roots: ProjectNode[] = [];

  for (const p of projects) {
    map.set(p.id, { ...p, children: [] });
  }
  for (const p of projects) {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function getProjectAndChildIds(
  projectId: string,
  allProjects: FlatProject[]
): string[] {
  const ids = [projectId];
  for (const p of allProjects) {
    if (p.parentId === projectId) ids.push(p.id);
  }
  return ids;
}
