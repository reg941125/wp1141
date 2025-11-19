import { randomUUID } from "node:crypto";
import type { Message } from "@line/bot-sdk";

import { getMessagesCollection, messageSchema } from "@/lib/db";
import type { MessageDocument } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { StructuredTodo } from "@/lib/llm/types";
import { BotIntent } from "@/lib/conversation/intents";
import { publishAdminEvent } from "@/lib/realtime/bus";

type MessageLogInput = {
  eventId?: string;
  userId: string;
  sessionId: string;
  direction: "inbound" | "outbound";
  channel?: MessageDocument["channel"];
  type?: MessageDocument["type"];
  payload: Record<string, unknown>;
  llmLatencyMs?: number;
  llmModel?: string;
  llmUsageTokens?: MessageDocument["llmUsageTokens"];
  metadata?: Record<string, unknown>;
};

const normalizeMessageType = (message: Message): MessageDocument["type"] => {
  switch (message.type) {
    case "text":
      return "text";
    case "flex":
      return "flex";
    case "template":
      return "template";
    default:
      return "system";
  }
};

const messageToPayload = (message: Message) => {
  switch (message.type) {
    case "text":
      return { text: message.text };
    default:
      return message as unknown as Record<string, unknown>;
  }
};

const buildTodoSnapshot = (todos?: StructuredTodo[]) => {
  if (!todos?.length) {
    return [];
  }
  return todos.slice(0, 15).map((todo) => ({
    title: todo.title,
    status: todo.status ?? "pending",
    priority: todo.priority ?? "medium",
    dueDate: todo.dueDate ?? null,
  }));
};

const sanitizeMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return undefined;
  }
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined && value !== null,
  );
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
};

export const recordMessage = async (input: MessageLogInput) => {
  try {
    const messages = await getMessagesCollection();
    const doc = messageSchema.parse({
      eventId: input.eventId ?? randomUUID(),
      userId: input.userId,
      sessionId: input.sessionId,
      direction: input.direction,
      channel: input.channel ?? "line",
      type: input.type ?? "text",
      payload: input.payload,
      llmLatencyMs: input.llmLatencyMs,
      llmModel: input.llmModel,
      llmUsageTokens: input.llmUsageTokens,
      metadata: input.metadata,
      createdAt: new Date(),
    });
    const result = await messages.insertOne(doc);
    publishAdminEvent({
      type: "message.recorded",
      payload: {
        id: result.insertedId.toString(),
        userId: doc.userId,
        sessionId: doc.sessionId,
        direction: doc.direction,
        messageType: doc.type,
        text:
          typeof doc.payload?.text === "string"
            ? (doc.payload.text as string)
            : undefined,
        metadata: doc.metadata,
        createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to record message", { input, error });
  }
};

export const recordInboundText = async (params: {
  eventId?: string;
  userId: string;
  sessionId: string;
  text: string;
  intent?: BotIntent;
  todosSnapshot?: StructuredTodo[];
}) => {
  return recordMessage({
    eventId: params.eventId,
    userId: params.userId,
    sessionId: params.sessionId,
    direction: "inbound",
    payload: { text: params.text },
    type: "text",
    metadata: sanitizeMetadata({
      intent: params.intent,
      todosSnapshot: buildTodoSnapshot(params.todosSnapshot),
    }),
  });
};

export const recordOutboundMessages = async (params: {
  userId: string;
  sessionId: string;
  messages: Message[];
  llmLatencyMs?: number;
  llmModel?: string;
  llmUsageTokens?: MessageDocument["llmUsageTokens"];
  metadata?: Record<string, unknown>;
}) => {
  for (const [index, message] of params.messages.entries()) {
    await recordMessage({
      userId: params.userId,
      sessionId: params.sessionId,
      direction: "outbound",
      type: normalizeMessageType(message),
      payload: messageToPayload(message),
      llmLatencyMs: index === 0 ? params.llmLatencyMs : undefined,
      llmModel: index === 0 ? params.llmModel : undefined,
      llmUsageTokens: index === 0 ? params.llmUsageTokens : undefined,
      metadata: index === 0 ? sanitizeMetadata(params.metadata) : undefined,
    });
  }
};

