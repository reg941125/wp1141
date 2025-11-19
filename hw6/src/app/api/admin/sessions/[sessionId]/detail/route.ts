import { NextResponse } from "next/server";

import { fetchSessionDetail } from "@/lib/admin/sessions";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const detail = await fetchSessionDetail(params.sessionId);
    return NextResponse.json({ ok: true, data: detail });
  } catch (error) {
    logger.error("Failed to load session detail", {
      error,
      sessionId: params.sessionId,
    });
    return NextResponse.json(
      { ok: false, error: "Session not found" },
      { status: 404 },
    );
  }
}

