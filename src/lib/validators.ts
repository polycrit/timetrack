import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  parentId: z.string().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

export const createTimeEntrySchema = z.object({
  description: z.string().max(500).default(""),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  projectId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial();
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const createGoalSchema = z.object({
  type: z.enum(["daily", "weekly"]),
  targetMinutes: z.number().int().positive(),
  projectId: z.string().nullable().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const entryFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectId: z.string().optional(),
  tagId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
