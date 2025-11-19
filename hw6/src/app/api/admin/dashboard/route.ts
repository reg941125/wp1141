import { NextResponse } from "next/server";

import {
  fetchDashboardStats,
  fetchOpenTodos,
  fetchRecentSessions,
} from "@/lib/admin/queries";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [stats, sessions, todos] = await Promise.all([
      fetchDashboardStats(),
      fetchRecentSessions(10),
      fetchOpenTodos(12),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        stats,
        sessions,
        todos,
      },
    });
  } catch (error) {
    logger.error("Failed to load admin dashboard", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to load dashboard data" },
      { status: 500 },
    );
  }
}

