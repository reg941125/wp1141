import { describe, expect, it } from "vitest";

import {
  BotIntent,
  detectIntent,
  isScriptedIntent,
} from "@/lib/conversation/intents";

describe("conversation intents", () => {
  it.each([
    ["請幫我說明功能", BotIntent.HELP],
    ["查看代辦有哪些", BotIntent.LIST],
    ["新增：明天買菜", BotIntent.QUICK_ADD],
    ["完成跑步任務", BotIntent.UPDATE],
    ["刪除舊任務", BotIntent.DELETE],
  ])("detectIntent(%s) -> %s", (input, expected) => {
    expect(detectIntent(input)).toBe(expected);
  });

  it("falls back for unknown commands", () => {
    expect(detectIntent("隨便說說")).toBe(BotIntent.FALLBACK);
  });

  it("recognises scripted intents", () => {
    expect(isScriptedIntent(BotIntent.HELP)).toBe(true);
    expect(isScriptedIntent(BotIntent.LIST)).toBe(true);
    expect(isScriptedIntent(BotIntent.QUICK_ADD)).toBe(false);
  });
});

