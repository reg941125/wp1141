import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { appendSessionNote } from "@/lib/admin/sessions";
import { recordAdminLog } from "@/lib/admin/logs";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().min(1, "note text is required"),
  author: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const json = await request.json();
    const payload = schema.parse(json);
    const note = await appendSessionNote({
      sessionId: params.sessionId,
      text: payload.text,
      author: payload.author ?? "admin",
    });
    await recordAdminLog({
      level: "info",
      message: "Admin added session note",
      context: {
        sessionId: params.sessionId,
        author: payload.author ?? "admin",
      },
    });
    return NextResponse.json({ ok: true, data: note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.flatten() },
        { status: 400 },
      );
    }
    logger.error("Failed to append session note", {
      error,
      sessionId: params.sessionId,
    });
    return NextResponse.json(
      { ok: false, error: "Unable to save note" },
      { status: 500 },
    );
  }
}

