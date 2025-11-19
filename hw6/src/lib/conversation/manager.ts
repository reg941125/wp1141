import { performance } from "node:perf_hooks";
import type { Message } from "@line/bot-sdk";

import { buildConversationContext } from "@/lib/conversation/context";
import { BotIntent, detectIntent, isScriptedIntent } from "@/lib/conversation/intents";
import { recordInboundText } from "@/lib/conversation/storage";
import {
  generateLlmResponse,
  LlmRateLimitError,
  LlmServiceError,
} from "@/lib/llm/service";
import type { PromptPayload } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import {
  applyTodoOperations,
  type TodoMutationResult,
} from "@/lib/todos/service";
import type { StructuredTodo } from "@/lib/llm/types";
import { recordAdminLog } from "@/lib/admin/logs";

type ManagerInput = {
  text: string;
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  language?: string;
  eventId?: string;
};

export type ManagerResult = {
  messages: Message[];
  intent: BotIntent;
  usedLlm: boolean;
  mutations?: TodoMutationResult[];
  userId: string;
  sessionId: string;
  todoSnapshot: StructuredTodo[];
  fallbackReason?: "rate_limit" | "llm_error";
  llmMeta?: {
    model: string;
    latencyMs: number;
    usage?: {
      promptTokens?: number;
      candidatesTokens?: number;
      totalTokens?: number;
    };
  };
};

const formatTodoLine = (options: {
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}) => {
  const due = options.dueDate ? `，截止 ${options.dueDate}` : "";
  const status = options.status ?? "pending";
  const priority = (options.priority ?? "medium").toUpperCase();
  return `• [${priority}][${status}] ${options.title}${due}`;
};

const formatTodoTable = (todos: StructuredTodo[]) => {
  if (todos.length === 0) {
    return "目前沒有任何代辦事項。";
  }
  const header = "| 任務 | 狀態 | 優先級 | 截止 |\n| --- | --- | --- | --- |";
  const rows = todos.slice(0, 6).map((todo) => {
    const status = todo.status ?? "pending";
    const priority = todo.priority ?? "medium";
    const due = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString("zh-TW") : "-";
    return `| ${todo.title} | ${status} | ${priority} | ${due} |`;
  });
  return [header, ...rows].join("\n");
};

const buildTodoJsonSnapshot = (todos: StructuredTodo[]) => {
  if (!todos.length) {
    return "```json\n[]\n```";
  }
  const snapshot = todos.slice(0, 6).map((todo) => ({
    title: todo.title,
    status: todo.status ?? "pending",
    priority: todo.priority ?? "medium",
    dueDate: todo.dueDate ?? null,
    remindAt: todo.remindAt ?? null,
    category: todo.category ?? null,
  }));
  return `\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``;
};

const buildSnapshotMessages = (
  heading: string,
  todos: StructuredTodo[],
): Message[] => {
  return [
    {
      type: "text",
      text: heading,
    },
    {
      type: "text",
      text: formatTodoTable(todos),
    },
    {
      type: "text",
      text: buildTodoJsonSnapshot(todos),
    },
  ];
};

const buildHelpMessages = (): Message[] => [
  {
    type: "text",
    text: [
      "我可以幫你：",
      "1. 新增/修改/刪除代辦",
      "2. 自動推論優先順序、分類與提醒",
      "3. 把任務拆解成可執行步驟",
      "4. 以表格或 JSON 呈現目前狀態",
      "",
      "範例：",
      "・「下週三前完成簡報並提醒我」",
      "・「把跑步任務標示完成」",
      "・「幫我把旅行計畫拆成步驟」",
    ].join("\n"),
  },
  {
    type: "template",
    altText: "功能清單",
    template: {
      type: "buttons",
      text: "選擇任務或直接輸入自然語言",
      actions: [
        { type: "message", label: "新增任務", text: "新增：安排年度體檢" },
        { type: "message", label: "查看清單", text: "查看代辦" },
        { type: "message", label: "拆解任務", text: "把產品發表會拆成任務" },
      ],
    },
  },
];

const buildListMessages = (payload: PromptPayload): Message[] => {
  if (payload.todos.length === 0) {
    return [
      {
        type: "text",
        text: "目前還沒有任何代辦，直接告訴我你想做什麼，我會幫你建立清單。",
      },
    ];
  }

  const topRows = payload.todos.slice(0, 5).map((todo) =>
    formatTodoLine({
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate,
    }),
  );

  return [
    {
      type: "text",
      text: ["以下是最近的重點代辦：", ...topRows].join("\n"),
    },
  ];
};

const buildScriptedResponse = (
  intent: BotIntent,
  payload: PromptPayload,
): Message[] => {
  switch (intent) {
    case BotIntent.HELP:
      return buildHelpMessages();
    case BotIntent.LIST:
      return buildListMessages(payload);
    default:
      return [
        {
          type: "text",
          text: "我正在升級中，稍後會支援此功能。你也可以直接用自然語言描述需求，我會協助處理。",
        },
      ];
  }
};

const buildRateLimitFallback = (payload: PromptPayload) => {
  const heading =
    "Gemini 目前用量已滿。我會記錄你的請求並在流量恢復後優先處理，以下是目前已知的代辦快照：";
  return buildSnapshotMessages(heading, payload.todos);
};

const buildServiceFallback = (payload: PromptPayload) => {
  const prefix =
    "智慧助理目前連線異常，我已保留你的訊息並會稍後再試。先提供即時代辦快照供你確認：";
  return buildSnapshotMessages(prefix, payload.todos);
};

export const handleConversationTurn = async (
  input: ManagerInput,
): Promise<ManagerResult> => {
  const intent = detectIntent(input.text);

  const context = await buildConversationContext({
    lineUserId: input.lineUserId,
    displayName: input.displayName,
    pictureUrl: input.pictureUrl,
    language: input.language,
  });

  const payload: PromptPayload = {
    userMessage: input.text,
    todos: context.todos,
    contextTurns: context.turns,
    locale: context.user.language ?? "zh-TW",
    timezone: "Asia/Taipei",
  };

  await recordInboundText({
    eventId: input.eventId,
    userId: context.user.lineUserId,
    sessionId: context.session.sessionId,
    text: input.text,
    intent,
    todosSnapshot: payload.todos,
  });

  if (isScriptedIntent(intent)) {
    return {
      intent,
      usedLlm: false,
      messages: buildScriptedResponse(intent, payload),
      userId: context.user.lineUserId,
      sessionId: context.session.sessionId,
      todoSnapshot: payload.todos,
      fallbackReason: undefined,
    };
  }

  try {
    const start = performance.now();
    const llmResponse = await generateLlmResponse(payload);
    const latencyMs = performance.now() - start;
    let mutations: TodoMutationResult[] | undefined;

    if (llmResponse.structured?.tasks?.length) {
      mutations = await applyTodoOperations({
        userId: context.user.lineUserId,
        sessionId: context.session.sessionId,
        sourceMessageId: input.eventId,
        tasks: llmResponse.structured.tasks,
      });
      logger.debug("Todo mutations applied", { mutations });
    }

    return {
      intent,
      usedLlm: true,
      messages: llmResponse.messages,
      mutations,
      userId: context.user.lineUserId,
      sessionId: context.session.sessionId,
      todoSnapshot: payload.todos,
      llmMeta: {
        model: llmResponse.model,
        latencyMs,
        usage: llmResponse.usage,
      },
      fallbackReason: undefined,
    };
  } catch (error) {
    if (error instanceof LlmRateLimitError) {
      await recordAdminLog({
        level: "warn",
        message: "LLM rate limit fallback",
        context: {
          userId: context.user.lineUserId,
          sessionId: context.session.sessionId,
          intent,
        },
      });
      logger.warn("LLM quota reached, falling back", { error });
      return {
        intent: BotIntent.FALLBACK,
        usedLlm: false,
        messages: buildRateLimitFallback(payload),
        userId: context.user.lineUserId,
        sessionId: context.session.sessionId,
        todoSnapshot: payload.todos,
        fallbackReason: "rate_limit",
      };
    }

    if (error instanceof LlmServiceError) {
      logger.error("LLM service error", { error });
    } else {
      logger.error("Unexpected LLM error", { error });
    }
    await recordAdminLog({
      level: "error",
      message: "LLM service failure fallback",
      context: {
        userId: context.user.lineUserId,
        sessionId: context.session.sessionId,
        intent,
      },
    });

    return {
      intent: BotIntent.FALLBACK,
      usedLlm: false,
      messages: buildServiceFallback(payload),
      userId: context.user.lineUserId,
      sessionId: context.session.sessionId,
      todoSnapshot: payload.todos,
      fallbackReason: "llm_error",
    };
  }
};

