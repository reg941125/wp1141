export enum BotIntent {
  HELP = "help",
  LIST = "list",
  QUICK_ADD = "quick_add",
  UPDATE = "update",
  DELETE = "delete",
  FALLBACK = "fallback",
}

const HELP_KEYWORDS = ["help", "說明", "教學", "功能", "？"];
const LIST_KEYWORDS = ["list", "查看", "列出", "查詢", "summary", "overview"];
const ADD_KEYWORDS = ["新增", "add", "create", "安排", "記得"];
const UPDATE_KEYWORDS = ["完成", "update", "改成", "標記", "done", "finish"];
const DELETE_KEYWORDS = ["刪除", "remove", "取消", "archive"];

export const detectIntent = (text: string): BotIntent => {
  const normalized = text.trim().toLowerCase();

  if (normalized.length === 0) {
    return BotIntent.HELP;
  }

  if (HELP_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return BotIntent.HELP;
  }

  if (LIST_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return BotIntent.LIST;
  }

  if (ADD_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return BotIntent.QUICK_ADD;
  }

  if (UPDATE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return BotIntent.UPDATE;
  }

  if (DELETE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return BotIntent.DELETE;
  }

  return BotIntent.FALLBACK;
};

export const isScriptedIntent = (intent: BotIntent) =>
  [BotIntent.HELP, BotIntent.LIST].includes(intent);

