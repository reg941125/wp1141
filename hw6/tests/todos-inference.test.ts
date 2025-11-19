import { describe, expect, it } from "vitest";

import {
  inferCategory,
  inferDueDate,
  inferPriority,
  inferRemindAt,
  inferStatus,
} from "@/lib/todos/inference";

describe("todo inference rules", () => {
  it("infers priority from keywords", () => {
    expect(inferPriority("今天要完成的緊急任務")).toBe("urgent");
    expect(inferPriority("請盡快處理")).toBe("high");
    expect(inferPriority("下個月規劃")).toBe("medium");
  });

  it("infers status based on verbs", () => {
    expect(inferStatus("已經完成報告")).toBe("completed");
    expect(inferStatus("正在進行整理")).toBe("in_progress");
    expect(inferStatus("取消這個任務")).toBe("archived");
  });

  it("detects reasonable categories", () => {
    expect(inferCategory("準備專案報告")).toBe("work");
    expect(inferCategory("要去體檢")).toBe("health");
    expect(inferCategory("旅遊訂機票")).toBe("travel");
  });

  it("infers due dates from natural language", () => {
    expect(inferDueDate("今天完成")).not.toBeUndefined();
    expect(inferDueDate("明天處理")).not.toBeUndefined();
    expect(inferDueDate("下週跟進")).not.toBeUndefined();
    expect(inferDueDate("普通任務")).toBeUndefined();
  });

  it("sets default reminder two hours before due date", () => {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 4);
    const remindAt = inferRemindAt(dueDate);
    expect(remindAt).toBeInstanceOf(Date);
    expect(
      Math.round(((dueDate.getTime() - (remindAt?.getTime() ?? 0)) / (60 * 60 * 1000)) * 10) / 10,
    ).toBeCloseTo(2);
  });
});

