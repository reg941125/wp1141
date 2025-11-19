import { describe, expect, it } from "vitest";

import { buildPrompt } from "@/lib/llm/prompt";

describe("prompt builder", () => {
  it("includes user message, context turns and todos", () => {
    const prompt = buildPrompt({
      userMessage: "請幫我安排體檢",
      todos: [
        {
          title: "準備簡報",
          status: "pending",
          priority: "high",
          dueDate: new Date().toISOString(),
        },
      ],
      contextTurns: [
        {
          role: "user",
          content: "嗨",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          role: "assistant",
          content: "你好",
          timestamp: "2024-01-01T00:00:01Z",
        },
      ],
      locale: "zh-TW",
      timezone: "Asia/Taipei",
    });

    expect(prompt).toContain("Linea Task Pilot");
    expect(prompt).toContain("準備簡報");
    expect(prompt).toContain("嗨");
    expect(prompt).toContain("請幫我安排體檢");
  });
});

