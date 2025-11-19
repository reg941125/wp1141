import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchRecentSessions } from "@/lib/admin/queries";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit") ?? "12";
  const limit = Number.isNaN(Number(limitParam))
    ? 12
    : Math.min(Math.max(parseInt(limitParam, 10), 1), 50);

  try {
    const sessions = await fetchRecentSessions(limit);
    return NextResponse.json({ ok: true, data: sessions });
  } catch (error) {
    logger.error("Failed to load admin sessions", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to load sessions" },
      { status: 500 },
    );
  }
}

