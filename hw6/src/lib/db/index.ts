export { getMongoClient, getMongoDatabase } from "./client";
export {
  getUsersCollection,
  getSessionsCollection,
  getTodosCollection,
  getMessagesCollection,
  ensureDbIndexes,
} from "./collections";
export {
  userSchema,
  sessionSchema,
  todoSchema,
  messageSchema,
  assistantSettingsSchema,
  adminLogSchema,
} from "./schemas";
export type {
  UserDocument,
  SessionDocument,
  TodoDocument,
  MessageDocument,
  AssistantSettingsDocument,
  AdminLogDocument,
} from "./schemas";

