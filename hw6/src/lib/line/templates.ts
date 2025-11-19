import type { FlexMessage, Message, TemplateMessage } from "@line/bot-sdk";

const landingFlex: FlexMessage = {
  type: "flex",
  altText: "Linea Task Pilot onboarding",
  contents: {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://placehold.co/600x400/10b981/FFFFFF?text=Linea+Task+Pilot",
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: "Linea Task Pilot",
          weight: "bold",
          size: "lg",
        },
        {
          type: "text",
          text: "智慧代辦助理，協助你分類、優先、提醒與拆解任務。",
          wrap: true,
          size: "sm",
          color: "#555555",
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          margin: "md",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "icon", url: "https://placehold.co/32x32/10b981/FFFFFF?text=%E2%9A%A1" },
                {
                  type: "text",
                  text: "自動推論期限、分類、優先級",
                  flex: 1,
                  wrap: true,
                  size: "sm",
                  color: "#222222",
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "icon", url: "https://placehold.co/32x32/0ea5e9/FFFFFF?text=%F0%9F%93%83" },
                {
                  type: "text",
                  text: "任務過大時自動拆解可執行步驟",
                  flex: 1,
                  wrap: true,
                  size: "sm",
                  color: "#222222",
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "icon", url: "https://placehold.co/32x32/f97316/FFFFFF?text=%F0%9F%93%8A" },
                {
                  type: "text",
                  text: "後台監控即時同步",
                  flex: 1,
                  wrap: true,
                  size: "sm",
                  color: "#222222",
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      spacing: "md",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#10b981",
          action: {
            type: "uri",
            label: "管理後台",
            uri: "https://your-vercel-app.vercel.app/admin",
          },
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "產品簡介",
            uri: "https://line.me/R/nv/#TODO",
          },
        },
      ],
    },
  },
};

const quickActionTemplate: TemplateMessage = {
  type: "template",
  altText: "快速指令",
  template: {
    type: "buttons",
    title: "快捷指令",
    text: "用自然語言描述代辦，我會轉成可追蹤清單。",
    actions: [
      { type: "message", label: "新增任務", text: "新增：本週完成報告" },
      { type: "message", label: "查看清單", text: "查看代辦" },
      { type: "message", label: "更新狀態", text: "把跑步任務改成完成" },
      {
        type: "uri",
        label: "開啟後台",
        uri: "https://your-vercel-app.vercel.app/admin",
      },
    ],
  },
};

export const bootstrapReplies = (displayName?: string): Message[] => [
  {
    type: "text",
    text: `嗨${displayName ? `，${displayName}` : ""}！我是 Linea Task Pilot，專職管理你的所有代辦。`,
  },
  landingFlex,
  quickActionTemplate,
];

