import { EventEmitter } from "node:events";

import type { TodoMutationResult } from "@/lib/todos/service";

type MessageRecordedEvent = {
  type: "message.recorded";
  payload: {
    id: string;
    userId: string;
    sessionId: string;
    direction: "inbound" | "outbound";
    messageType: string;
    text?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  };
};

type TodoMutationEvent = {
  type: "todo.mutation";
  payload: {
    userId: string;
    sessionId: string;
    mutation: TodoMutationResult;
  };
};

type StatsEvent = {
  type: "stats.refresh";
  payload: Record<string, unknown>;
};

export type AdminEvent = MessageRecordedEvent | TodoMutationEvent | StatsEvent;

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

export const publishAdminEvent = (event: AdminEvent) => {
  emitter.emit("event", event);
};

export const subscribeAdminEvents = (
  listener: (event: AdminEvent) => void,
) => {
  emitter.on("event", listener);
  return () => {
    emitter.off("event", listener);
  };
};

