import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchSessionMessages } from "@/lib/admin/queries";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "sessionId is required" },
      { status: 400 },
    );
  }

  const limitParam = request.nextUrl.searchParams.get("limit") ?? "60";
  const limit = Number.isNaN(Number(limitParam))
    ? 60
    : Math.min(Math.max(parseInt(limitParam, 10), 1), 200);

  try {
    const messages = await fetchSessionMessages(sessionId, limit);
    return NextResponse.json({ ok: true, data: messages });
  } catch (error) {
    logger.error("Failed to load session messages", { error, sessionId });
    return NextResponse.json(
      { ok: false, error: "Unable to load messages" },
      { status: 500 },
    );
  }
}

