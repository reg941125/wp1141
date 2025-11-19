import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { formatTodoDocuments } from "@/lib/admin/queries";
import { createTodo, listTodos } from "@/lib/todos/service";
import type { TodoPriority, TodoStatus } from "@/lib/llm/types";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const createTodoSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  title: z.string().min(1),
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const statusParam = searchParams.get("status") as TodoStatus | "active" | null;
  const userId = searchParams.get("userId") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const priorityParams = searchParams.getAll("priority") as TodoPriority[];
  const limitParam = searchParams.get("limit") ?? "50";
  const limit = Number.isNaN(Number(limitParam))
    ? 50
    : Math.min(Math.max(parseInt(limitParam, 10), 1), 200);

  try {
    const todos = await listTodos({
      userId,
      status: statusParam ?? undefined,
      search,
      priority: priorityParams.length ? priorityParams : undefined,
      limit,
    });
    return NextResponse.json({ ok: true, data: formatTodoDocuments(todos) });
  } catch (error) {
    logger.error("Failed to list todos", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to load todos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = createTodoSchema.parse(json);
    const created = await createTodo(payload);
    return NextResponse.json({ ok: true, data: formatTodoDocuments([created])[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    logger.error("Failed to create todo", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to create todo" },
      { status: 500 },
    );
  }
}

