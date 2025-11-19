import type { Message, WebhookEvent } from "@line/bot-sdk";
import { validateSignature } from "@line/bot-sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ensureDbIndexes } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getLineClient } from "@/lib/line/client";
import { handleConversationTurn } from "@/lib/conversation/manager";
import { recordOutboundMessages } from "@/lib/conversation/storage";
import { bootstrapReplies } from "@/lib/line/templates";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

type WebhookRequestBody = {
  destination?: string;
  events?: WebhookEvent[];
};

type HandlerResult = {
  eventId: string;
  type: WebhookEvent["type"];
  status: "replied" | "skipped" | "failed";
  reason?: string;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "LINE webhook is alive. Configure this endpoint in LINE Developers Console.",
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  const { LINE_CHANNEL_SECRET } = getServerEnv();

  await ensureDbIndexes().catch((error) => {
    logger.error("Failed to ensure MongoDB indexes", error);
  });

  if (!signature || !validateSignature(rawBody, LINE_CHANNEL_SECRET, signature)) {
    logger.warn("Rejected request due to invalid LINE signature");
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    logger.error("Invalid JSON from LINE webhook", error);
    return NextResponse.json({ ok: false, error: "Malformed payload" }, { status: 400 });
  }

  const events = body.events ?? [];

  if (events.length === 0) {
    return NextResponse.json({ ok: true, message: "No events to process" });
  }

  const results = await Promise.all(events.map(handleEvent));

  return NextResponse.json({ ok: true, results });
}

const handleEvent = async (event: WebhookEvent): Promise<HandlerResult> => {
  const result: HandlerResult = {
    eventId: "message" in event ? event.message.id ?? "n/a" : "n/a",
    type: event.type,
    status: "skipped",
  };

  try {
    switch (event.type) {
      case "message":
        if (event.message.type !== "text") {
          result.reason = "Non-text message ignored";
          return result;
        }
        if (!event.source || !("userId" in event.source) || !event.source.userId) {
          result.reason = "Missing userId";
          return result;
        }

        const userProfile = await fetchLineProfile(event.source.userId);
        const conversation = await handleConversationTurn({
          text: event.message.text,
          lineUserId: event.source.userId,
          displayName: userProfile?.displayName,
          pictureUrl: userProfile?.pictureUrl,
          language: userProfile?.language,
          eventId: event.message.id,
        });
        const todoSnapshotForLog = conversation.todoSnapshot
          .slice(0, 15)
          .map((todo) => ({
            title: todo.title,
            status: todo.status ?? "pending",
            priority: todo.priority ?? "medium",
            dueDate: todo.dueDate ?? null,
          }));
        await reply(event.replyToken, conversation.messages);
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
            intent: conversation.intent,
            usedLlm: conversation.usedLlm,
            mutations: conversation.mutations,
            todosSnapshot: todoSnapshotForLog,
            fallbackReason: conversation.fallbackReason,
          },
        });
        result.status = "replied";
        return result;

      case "follow":
      case "join":
        await reply(event.replyToken, bootstrapReplies());
        result.status = "replied";
        return result;

      default:
        result.reason = `Unhandled event type: ${event.type}`;
        return result;
    }
  } catch (error) {
    logger.error("Failed to handle LINE event", { event, error });
    result.status = "failed";
    result.reason = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
};

const reply = async (replyToken: string, messages: Message[]) => {
  const client = getLineClient();
  await client.replyMessage(replyToken, messages);
};

const fetchLineProfile = async (userId: string) => {
  const client = getLineClient();
  try {
    return await client.getProfile(userId);
  } catch (error) {
    logger.warn("Unable to fetch LINE profile", { error });
    return undefined;
  }
};

