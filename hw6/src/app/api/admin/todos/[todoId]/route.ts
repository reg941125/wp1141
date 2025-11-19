import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteTodo, updateTodo } from "@/lib/todos/service";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const updateTodoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "archived"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  dueDate: z.string().optional(),
  remindAt: z.string().optional(),
  category: z.string().optional(),
  contexts: z.array(z.string()).optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        status: z.enum(["pending", "completed"]).optional(),
      }),
    )
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { todoId: string } },
) {
  try {
    const json = await request.json();
    const updates = updateTodoSchema.parse(json);
    const updated = await updateTodo({ todoId: params.todoId, updates });
    return NextResponse.json({
      ok: true,
      data: {
        id: updated._id?.toString() ?? params.todoId,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
        dueDate: updated.dueDate?.toISOString() ?? null,
        remindAt: updated.remindAt?.toISOString() ?? null,
        contexts: updated.contexts,
        updatedAt: updated.updatedAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.flatten() },
        { status: 400 },
      );
    }
    logger.error("Failed to update todo", { error, todoId: params.todoId });
    return NextResponse.json(
      { ok: false, error: "Unable to update todo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { todoId: string } },
) {
  try {
    await deleteTodo(params.todoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to delete todo", { error, todoId: params.todoId });
    return NextResponse.json(
      { ok: false, error: "Unable to delete todo" },
      { status: 500 },
    );
  }
}

