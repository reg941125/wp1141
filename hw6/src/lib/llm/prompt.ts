import type { PromptPayload, StructuredTodo } from "@/lib/llm/types";

const RESPONSE_REQUIREMENTS = `
- 所有輸出的「代辦清單」需同時提供 (1) Markdown 表格 (2) JSON payload，並以 \`json\` fenced code block 包起來，方便程式解析。
- 若資訊不足，必須以「追問區塊」列出需要補充的欄位，不得臆測。
- 任務過大時，自動拆解為 2~5 個可執行子任務，寫入 subtasks。
- 未指定優先/分類/截止/提醒時要合理推斷並說明推論依據。
- 回覆語言使用繁體中文，語氣專業但親切。
`;

const TABLE_HEADER = `| 任務 | 狀態 | 優先級 | 截止 | 提醒 | 分類 | 備註 |
| --- | --- | --- | --- | --- | --- | --- |`;

const serializeTodos = (todos: StructuredTodo[]) =>
  todos
    .map((todo) => ({
      title: todo.title,
      status: todo.status ?? "pending",
      priority: todo.priority ?? "medium",
      dueDate: todo.dueDate ?? null,
      remindAt: todo.remindAt ?? null,
      category: todo.category ?? null,
      contexts: todo.contexts ?? [],
      subtasks: todo.subtasks ?? [],
      inferredFrom: todo.inferredFrom ?? "",
    }))
    .slice(0, 25);

export const SYSTEM_PROMPT = `
你是「Linea Task Pilot」，一個專業代辦事項管理助理。
職責：
1. 解析任何自然語言輸入並轉成結構化代辦。
2. 自動判斷優先級、分類、提醒時間與截止日期。
3. 任務過大時主動拆解為可執行步驟。
4. 維持對話脈絡並追問缺失資訊。
5. 回傳內容清楚、有條理、簡潔但完整。

輸出規則：
${RESPONSE_REQUIREMENTS}

請以以下結構回覆：
1. **重點摘要**：簡述此次操作 (最多 2 句)。
2. **代辦表格**：使用 Markdown 表格，標題列固定為 ${TABLE_HEADER.replaceAll("\n", " ")}。
3. **JSON**：以 \`\`\`json 開頭，欄位包含 tasks、followUps、assumptions。
4. **追問區塊**：若需要補充資訊，以條列列出問題，否則省略。
`;

const formatContext = (payload: PromptPayload) => {
  const ordered = payload.contextTurns
    .slice(-8)
    .map(
      (turn) =>
        `[${turn.timestamp ?? "unknown"}][${turn.role.toUpperCase()}] ${turn.content}`,
    )
    .join("\n");

  const todoSnapshot =
    payload.todos.length > 0
      ? JSON.stringify(serializeTodos(payload.todos), null, 2)
      : "[]";

  return `
<context>
時區：${payload.timezone ?? "Asia/Taipei"}
語系：${payload.locale ?? "zh-TW"}
現有代辦（JSON 陣列）：${todoSnapshot}
最近對話（新到舊）：
${ordered}
</context>`;
};

export const buildPrompt = (payload: PromptPayload) => {
  return `
${SYSTEM_PROMPT}
${formatContext(payload)}

<user_message>
${payload.userMessage}
</user_message>
`;
};

