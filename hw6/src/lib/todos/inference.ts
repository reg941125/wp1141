import type { TodoPriority, TodoStatus } from "@/lib/llm/types";

const PRIORITY_RULES: Array<{ keywords: RegExp; priority: TodoPriority }> = [
  { keywords: /(urgent|緊急|今天|today|馬上)/i, priority: "urgent" },
  { keywords: /(明天|tomorrow|盡快| asap )/i, priority: "high" },
  { keywords: /(本週|this week|計畫|整理|review)/i, priority: "medium" },
];

const CATEGORY_RULES = [
  { keywords: /(報告|簡報|meeting|專案|project)/i, category: "work" },
  { keywords: /(運動|健身|health|醫院|體檢)/i, category: "health" },
  { keywords: /(家事|掃|煮|家庭)/i, category: "home" },
  { keywords: /(旅遊|出遊|ticket|book)/i, category: "travel" },
];

const STATUS_KEYWORDS: Array<{ regex: RegExp; status: TodoStatus }> = [
  { regex: /(完成|done|finished|已經)/i, status: "completed" },
  { regex: /(進行|in progress|處理)/i, status: "in_progress" },
  { regex: /(取消|不做|刪除|archive)/i, status: "archived" },
];

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const inferPriority = (text: string): TodoPriority => {
  const match = PRIORITY_RULES.find((rule) => rule.keywords.test(text));
  return match?.priority ?? "medium";
};

export const inferCategory = (text: string) => {
  const match = CATEGORY_RULES.find((rule) => rule.keywords.test(text));
  return match?.category ?? "general";
};

export const inferStatus = (text: string): TodoStatus | undefined => {
  const match = STATUS_KEYWORDS.find((rule) => rule.regex.test(text));
  return match?.status;
};

export const inferDueDate = (text: string) => {
  if (/(today|今天|今晚)/i.test(text)) {
    return addDays(0);
  }
  if (/(tomorrow|明天)/i.test(text)) {
    return addDays(1);
  }
  if (/(next week|下週|下周)/i.test(text)) {
    return addDays(7);
  }
  if (/(next month|下個月)/i.test(text)) {
    return addDays(30);
  }
  return undefined;
};

export const inferRemindAt = (dueDate?: Date | null) => {
  if (!dueDate) {
    return undefined;
  }
  const reminder = new Date(dueDate);
  reminder.setHours(reminder.getHours() - 2);
  return reminder;
};

