import {
  getMessagesCollection,
  getSessionsCollection,
  getTodosCollection,
  getUsersCollection,
} from "@/lib/db";
import type { MessageDocument, TodoDocument } from "@/lib/db";

export type DashboardStats = {
  totalUsers: number;
  activeSessions24h: number;
  openTodos: number;
  messageVolume24h: number;
  llmRequests24h: number;
  llmSuccessRate: number;
  rateLimitCount24h: number;
  avgLlmLatencyMs: number | null;
  todoCompletionRate: number;
};

export type SessionSummary = {
  sessionId: string;
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  inboundCount: number;
  outboundCount: number;
  fallbackCount: number;
  active: boolean;
};

export type AdminMessage = {
  id: string;
  direction: MessageDocument["direction"];
  type: MessageDocument["type"];
  payload: MessageDocument["payload"];
  metadata?: MessageDocument["metadata"];
  llmLatencyMs?: number;
  createdAt: string;
};

const summarizeTodo = (todo: TodoDocument) => ({
  id: todo._id?.toString() ?? "",
  title: todo.title,
  status: todo.status,
  priority: todo.priority,
  dueDate: todo.dueDate?.toISOString() ?? null,
  userId: todo.userId,
  sessionId: todo.sessionId,
  category: todo.category,
  updatedAt: todo.updatedAt?.toISOString() ?? null,
});

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [users, sessions, todos, messages] = await Promise.all([
    getUsersCollection(),
    getSessionsCollection(),
    getTodosCollection(),
    getMessagesCollection(),
  ]);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeSessions24h,
    openTodos,
    completedTodos,
    totalTodos,
    inbound24h,
    outbound24h,
    llmRequests24h,
    llmFallbacks24h,
    rateLimitCount24h,
    avgLatencyAgg,
  ] = await Promise.all([
    users.countDocuments(),
    sessions.countDocuments({ lastActivityAt: { $gte: dayAgo } }),
    todos.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
    todos.countDocuments({ status: "completed" }),
    todos.countDocuments({}),
    messages.countDocuments({ direction: "inbound", createdAt: { $gte: dayAgo } }),
    messages.countDocuments({ direction: "outbound", createdAt: { $gte: dayAgo } }),
    messages.countDocuments({
      direction: "outbound",
      "metadata.usedLlm": true,
      createdAt: { $gte: dayAgo },
    }),
    messages.countDocuments({
      direction: "outbound",
      "metadata.fallbackReason": { $exists: true, $ne: null },
      createdAt: { $gte: dayAgo },
    }),
    messages.countDocuments({
      direction: "outbound",
      "metadata.fallbackReason": "rate_limit",
      createdAt: { $gte: dayAgo },
    }),
    messages
      .aggregate<{ _id: null; avgLatency: number }>([
        {
          $match: {
            direction: "outbound",
            llmLatencyMs: { $ne: null },
            createdAt: { $gte: dayAgo },
          },
        },
        {
          $group: {
            _id: null,
            avgLatency: { $avg: "$llmLatencyMs" },
          },
        },
      ])
      .toArray(),
  ]);

  const avgLatencyMs =
    Array.isArray(avgLatencyAgg) && avgLatencyAgg.length > 0
      ? Math.round(avgLatencyAgg[0].avgLatency)
      : null;

  const successRate =
    llmRequests24h === 0
      ? 1
      : (llmRequests24h - llmFallbacks24h) / Math.max(llmRequests24h, 1);

  return {
    totalUsers,
    activeSessions24h,
    openTodos,
    messageVolume24h: inbound24h + outbound24h,
    llmRequests24h,
    llmSuccessRate: Number(successRate.toFixed(2)),
    rateLimitCount24h,
    avgLlmLatencyMs: avgLatencyMs,
    todoCompletionRate:
      totalTodos === 0 ? 0 : Number((completedTodos / totalTodos).toFixed(2)),
  };
};

export const fetchRecentSessions = async (
  limit = 12,
): Promise<SessionSummary[]> => {
  const [sessions, users, messages] = await Promise.all([
    getSessionsCollection(),
    getUsersCollection(),
    getMessagesCollection(),
  ]);

  const sessionDocs = await sessions
    .find({})
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .toArray();

  if (sessionDocs.length === 0) {
    return [];
  }

  const userIds = [...new Set(sessionDocs.map((session) => session.userId))];
  const sessionIds = sessionDocs.map((session) => session.sessionId);

  const [userDocs, messageAgg] = await Promise.all([
    users
      .find({ lineUserId: { $in: userIds } })
      .project({ lineUserId: 1, displayName: 1, pictureUrl: 1 })
      .toArray(),
    messages
      .aggregate<{
        _id: string;
        lastMessage: MessageDocument;
        inboundCount: number;
        outboundCount: number;
        fallbackCount: number;
      }>([
        { $match: { sessionId: { $in: sessionIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$sessionId",
            lastMessage: { $first: "$$ROOT" },
            inboundCount: {
              $sum: {
                $cond: [{ $eq: ["$direction", "inbound"] }, 1, 0],
              },
            },
            outboundCount: {
              $sum: {
                $cond: [{ $eq: ["$direction", "outbound"] }, 1, 0],
              },
            },
            fallbackCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$metadata", null] },
                      { $ne: ["$metadata.fallbackReason", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray(),
  ]);

  const userMap = new Map(userDocs.map((user) => [user.lineUserId, user]));
  const messageMap = new Map(messageAgg.map((doc) => [doc._id, doc]));

  return sessionDocs.map((session) => {
    const user = userMap.get(session.userId);
    const messageInfo = messageMap.get(session.sessionId);
    const lastMessage = messageInfo?.lastMessage;

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      displayName: user?.displayName ?? session.userId,
      pictureUrl: user?.pictureUrl,
      lastMessageText:
        typeof lastMessage?.payload?.text === "string"
          ? lastMessage.payload.text
          : undefined,
      lastMessageAt: lastMessage?.createdAt?.toISOString(),
      inboundCount: messageInfo?.inboundCount ?? 0,
      outboundCount: messageInfo?.outboundCount ?? 0,
      fallbackCount: messageInfo?.fallbackCount ?? 0,
      active: session.lastActivityAt
        ? Date.now() - session.lastActivityAt.getTime() < 5 * 60 * 1000
        : false,
    };
  });
};

export const fetchSessionMessages = async (
  sessionId: string,
  limit = 60,
): Promise<AdminMessage[]> => {
  const messages = await getMessagesCollection();
  const docs = await messages
    .find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs
    .reverse()
    .map((doc) => ({
      id: doc._id?.toString() ?? doc.eventId,
      direction: doc.direction,
      type: doc.type,
      payload: doc.payload,
      metadata: doc.metadata,
      createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
      llmLatencyMs: doc.llmLatencyMs,
    }));
};

export const fetchOpenTodos = async (limit = 12) => {
  const todos = await getTodosCollection();
  const docs = await todos
    .find({ status: { $in: ["pending", "in_progress"] } })
    .sort({ priority: 1, dueDate: 1 })
    .limit(limit)
    .toArray();
  return docs.map(summarizeTodo);
};

export const formatTodoDocuments = (docs: TodoDocument[]) =>
  docs.map(summarizeTodo);

