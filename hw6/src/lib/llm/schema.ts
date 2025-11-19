import { z } from "zod";

export const structuredSubtaskSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["pending", "completed"]).default("pending"),
});

export const structuredTodoSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "archived"]).optional(),
  dueDate: z.string().optional(),
  remindAt: z.string().optional(),
  contexts: z.array(z.string()).optional(),
  inferredFrom: z.string().optional(),
  subtasks: z.array(structuredSubtaskSchema).optional(),
});

export const structuredPayloadSchema = z.object({
  tasks: z.array(structuredTodoSchema).default([]),
  followUps: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
});

export type StructuredPayload = z.infer<typeof structuredPayloadSchema>;

