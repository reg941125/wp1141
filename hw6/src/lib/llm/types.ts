export type TodoPriority = "urgent" | "high" | "medium" | "low";
export type TodoStatus = "pending" | "in_progress" | "completed" | "archived";

export type StructuredSubtask = {
  title: string;
  status?: "pending" | "completed";
};

export type StructuredTodo = {
  clientId?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  dueDate?: string;
  remindAt?: string;
  contexts?: string[];
  inferredFrom?: string;
  subtasks?: StructuredSubtask[];
};

export type ConversationTurn = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
};

export type PromptPayload = {
  userMessage: string;
  todos: StructuredTodo[];
  contextTurns: ConversationTurn[];
  locale?: string;
  timezone?: string;
};

