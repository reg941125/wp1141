import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { handleConversationTurn } from "@/lib/conversation/manager";
import { recordOutboundMessages } from "@/lib/conversation/storage";
import {
  getMessagesCollection,
  getSessionsCollection,
  getUsersCollection,
} from "@/lib/db";
import { getLineClient } from "@/lib/line/client";
import { logger } from "@/lib/logger";
import { recordAdminLog } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const [sessions, users, messages] = await Promise.all([
      getSessionsCollection(),
      getUsersCollection(),
      getMessagesCollection(),
    ]);

    const session = await sessions.findOne({ sessionId: params.sessionId });
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Session not found" },
        { status: 404 },
      );
    }
    const user = await users.findOne({ lineUserId: session.userId });
    const inbound = await messages
      .find({ sessionId: session.sessionId, direction: "inbound" })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    const text =
      typeof inbound?.payload?.text === "string"
        ? (inbound.payload.text as string)
        : null;

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "No inbound text to replay" },
        { status: 400 },
      );
    }

    const conversation = await handleConversationTurn({
      text,
      lineUserId: session.userId,
      displayName: user?.displayName,
      pictureUrl: user?.pictureUrl,
      language: user?.language,
      eventId: randomUUID(),
    });

    const client = getLineClient();
    await client.pushMessage(session.userId, conversation.messages);
    await recordOutboundMessages({
      userId: conversation.userId,
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      llmLatencyMs: conversation.llmMeta?.latencyMs,
      llmModel: conversation.llmMeta?.model,
      llmUsageTokens: conversation.llmMeta?.usage
        ? {
            prompt: conversation.llmMeta.usage.promptTokens,
            completion: conversation.llmMeta.usage.candidatesTokens,
            total: conversation.llmMeta.usage.totalTokens,
          }
        : undefined,
      metadata: {
        intent: "admin_retry",
        sourceMessageId: inbound?.eventId,
      },
    });
    await recordAdminLog({
      level: "info",
      message: "Admin triggered LLM retry",
      context: {
        sessionId: conversation.sessionId,
        userId: conversation.userId,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        messages: conversation.messages,
        llmMeta: conversation.llmMeta,
      },
    });
  } catch (error) {
    logger.error("Failed to replay LLM conversation", {
      error,
      sessionId: params.sessionId,
    });
    return NextResponse.json(
      { ok: false, error: "Unable to retry conversation" },
      { status: 500 },
    );
  }
}

