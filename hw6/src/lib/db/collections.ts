import type { Collection } from "mongodb";
import { getMongoDatabase } from "@/lib/db/client";
import type {
  AdminLogDocument,
  AssistantSettingsDocument,
  MessageDocument,
  SessionDocument,
  TodoDocument,
  UserDocument,
} from "@/lib/db/schemas";

const collectionCache: Record<string, Collection> = {};
let indexesEnsured = false;

const getCollection = async <T>(name: string) => {
  if (collectionCache[name]) {
    return collectionCache[name] as Collection<T>;
  }
  const db = await getMongoDatabase();
  const collection = db.collection<T>(name);
  collectionCache[name] = collection;
  return collection;
};

export const getUsersCollection = async () =>
  getCollection<UserDocument>("users");

export const getSessionsCollection = async () =>
  getCollection<SessionDocument>("sessions");

export const getTodosCollection = async () =>
  getCollection<TodoDocument>("todos");

export const getMessagesCollection = async () =>
  getCollection<MessageDocument>("messages");

export const getSettingsCollection = async () =>
  getCollection<AssistantSettingsDocument>("settings");

export const getAdminLogsCollection = async () =>
  getCollection<AdminLogDocument>("admin_logs");

export const ensureDbIndexes = async () => {
  if (indexesEnsured) {
    return;
  }
  const [users, sessions, todos, messages, settings, adminLogs] = await Promise.all([
    getUsersCollection(),
    getSessionsCollection(),
    getTodosCollection(),
    getMessagesCollection(),
    getSettingsCollection(),
    getAdminLogsCollection(),
  ]);

  await Promise.all([
    users.createIndex({ lineUserId: 1 }, { unique: true }),
    sessions.createIndex({ sessionId: 1 }, { unique: true }),
    sessions.createIndex({ userId: 1, lastActivityAt: -1 }),
    todos.createIndex({ userId: 1, status: 1, priority: 1 }),
    todos.createIndex({ dueDate: 1 }, { sparse: true }),
    messages.createIndex({ sessionId: 1, createdAt: -1 }),
    settings.createIndex({ key: 1 }, { unique: true }),
    adminLogs.createIndex({ level: 1, createdAt: -1 }),
  ]);
  indexesEnsured = true;
};

