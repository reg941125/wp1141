import type { Message } from "@line/bot-sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordOutboundMessages } from "@/lib/conversation/storage";
import { getSessionsCollection, getUsersCollection } from "@/lib/db";
import { getLineClient } from "@/lib/line/client";
import { bootstrapReplies } from "@/lib/line/templates";
import { logger } from "@/lib/logger";
import { recordAdminLog } from "@/lib/admin/logs";

export const runtime = "nodejs";

const schema = z.object({
  preset: z.enum(["welcome", "help", "custom"]).default("welcome"),
  message: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    const [sessions, users] = await Promise.all([
      getSessionsCollection(),
      getUsersCollection(),
    ]);
    const session = await sessions.findOne({ sessionId: params.sessionId });
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Session not found" },
        { status: 404 },
      );
    }
    const user = await users.findOne({ lineUserId: session.userId });

    let messages: Message[] = [];
    if (payload.preset === "custom") {
      if (!payload.message?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Custom message is required" },
          { status: 400 },
        );
      }
      messages = [{ type: "text", text: payload.message.trim() }];
    } else if (payload.preset === "help") {
      messages = [
        {
          type: "text",
          text: "這裡是 Linea Task Pilot 管理員，提供快速操作指引：\n1. 描述任務即可自動拆解\n2. 說「查看代辦」取得表格\n3. 有需要可直接說「完成 xxx」更新狀態",
        },
      ];
    } else {
      messages = bootstrapReplies(user?.displayName);
    }

    const client = getLineClient();
    await client.pushMessage(session.userId, messages);
    await recordOutboundMessages({
      userId: session.userId,
      sessionId: session.sessionId,
      messages,
      metadata: {
        intent: "admin_manual",
        preset: payload.preset,
      },
    });

    await recordAdminLog({
      level: "info",
      message: "Admin sent preset message",
      context: {
        sessionId: session.sessionId,
        userId: session.userId,
        preset: payload.preset,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.flatten() },
        { status: 400 },
      );
    }
    logger.error("Failed to resend LINE message", { error, params });
    return NextResponse.json(
      { ok: false, error: "Unable to send message" },
      { status: 500 },
    );
  }
}

