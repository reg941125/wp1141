import { NextResponse } from "next/server";

import { fetchAdminLogs } from "@/lib/admin/logs";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const logs = await fetchAdminLogs(50);
    return NextResponse.json({ ok: true, data: logs });
  } catch (error) {
    logger.error("Failed to load admin logs", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to load logs" },
      { status: 500 },
    );
  }
}

