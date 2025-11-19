import { randomUUID } from "node:crypto";
import {
  ensureDbIndexes,
  getMessagesCollection,
  getSessionsCollection,
  getTodosCollection,
  getUsersCollection,
  type MessageDocument,
  type SessionDocument,
  type TodoDocument,
  type UserDocument,
} from "@/lib/db";
import type { ConversationTurn, StructuredTodo } from "@/lib/llm/types";
import { logger } from "@/lib/logger";

type ContextInput = {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  language?: string;
};

export type ConversationContext = {
  user: UserDocument;
  session: SessionDocument;
  turns: ConversationTurn[];
  todos: StructuredTodo[];
};

const upsertUser = async (input: ContextInput) => {
  await ensureDbIndexes();
  const users = await getUsersCollection();

  const existing = await users.findOne({ lineUserId: input.lineUserId });
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          displayName: input.displayName ?? existing.displayName,
          pictureUrl: input.pictureUrl ?? existing.pictureUrl,
          language: input.language ?? existing.language,
          updatedAt: new Date(),
        },
      },
    );
    return { ...existing, ...input, updatedAt: new Date() } as UserDocument;
  }

  const newUser: UserDocument = {
    lineUserId: input.lineUserId,
    displayName: input.displayName,
    pictureUrl: input.pictureUrl,
    language: input.language,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await users.insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
};

const getOrCreateSession = async (user: UserDocument) => {
  const sessions = await getSessionsCollection();
  const existing = await sessions.findOne({ userId: user.lineUserId });
  if (existing) {
    await sessions.updateOne(
      { _id: existing._id },
      { $set: { lastActivityAt: new Date(), updatedAt: new Date() } },
    );
    return existing;
  }

  const session: SessionDocument = {
    userId: user.lineUserId,
    sessionId: randomUUID(),
    channel: "line",
    startedAt: new Date(),
    lastActivityAt: new Date(),
     updatedAt: new Date(),
    tags: [],
  };
  const result = await sessions.insertOne(session);
  return { ...session, _id: result.insertedId };
};

const mapMessageToTurn = (doc: MessageDocument): ConversationTurn => ({
  role: doc.direction === "inbound" ? "user" : "assistant",
  content:
    typeof doc.payload?.text === "string"
      ? doc.payload.text
      : JSON.stringify(doc.payload),
  timestamp: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
});

const mapTodoDocument = (doc: TodoDocument): StructuredTodo => ({
  clientId: doc._id?.toString(),
  title: doc.title,
  description: doc.description,
  category: doc.category,
  priority: doc.priority,
  status: doc.status,
  dueDate: doc.dueDate?.toISOString(),
  remindAt: doc.remindAt?.toISOString(),
  contexts: doc.contexts,
  subtasks: doc.subtasks ?? [],
});

const fetchRecentTurns = async (session: SessionDocument) => {
  const messages = await getMessagesCollection();
  const docs = await messages
    .find({ sessionId: session.sessionId })
    .sort({ createdAt: -1 })
    .limit(12)
    .toArray();
  return docs.reverse().map(mapMessageToTurn);
};

const fetchActiveTodos = async (user: UserDocument) => {
  const todos = await getTodosCollection();
  const docs = await todos
    .find({ userId: user.lineUserId, status: { $ne: "archived" } })
    .sort({ priority: 1, dueDate: 1 })
    .limit(50)
    .toArray();
  return docs.map(mapTodoDocument);
};

export const buildConversationContext = async (
  input: ContextInput,
): Promise<ConversationContext> => {
  try {
    const user = await upsertUser(input);
    const session = await getOrCreateSession(user);
    const [turns, todos] = await Promise.all([
      fetchRecentTurns(session),
      fetchActiveTodos(user),
    ]);

    return { user, session, turns, todos };
  } catch (error) {
    logger.error("Failed to build conversation context", { error });
    throw error;
  }
};

