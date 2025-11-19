import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAssistantSettings,
  updateAssistantSettings,
} from "@/lib/settings/service";
import { logger } from "@/lib/logger";
import { recordAdminLog } from "@/lib/admin/logs";

export const runtime = "nodejs";

const schema = z.object({
  defaultPriority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  defaultReminderLeadHours: z.number().min(0).max(72).optional(),
});

export async function GET() {
  try {
    const settings = await getAssistantSettings();
    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    logger.error("Failed to fetch settings", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to load settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = schema.parse(json);
    const updated = await updateAssistantSettings(payload);
    await recordAdminLog({
      level: "info",
      message: "Assistant settings updated",
      context: payload,
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.flatten() },
        { status: 400 },
      );
    }
    logger.error("Failed to update settings", { error });
    return NextResponse.json(
      { ok: false, error: "Unable to update settings" },
      { status: 500 },
    );
  }
}

