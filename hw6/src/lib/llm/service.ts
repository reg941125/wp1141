import type { Message } from "@line/bot-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getServerEnv } from "@/lib/env";
import { structuredPayloadSchema, type StructuredPayload } from "@/lib/llm/schema";
import { buildPrompt, SYSTEM_PROMPT } from "@/lib/llm/prompt";
import type { PromptPayload } from "@/lib/llm/types";
import { logger } from "@/lib/logger";

type LlmUsage = {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
};

type LlmResult = {
  messages: Message[];
  promptPreview: string;
  structured?: StructuredPayload;
  model: string;
  usage?: LlmUsage;
};

const GEMINI_MODEL = "gemini-1.5-pro-latest";
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const SERVICE_ERROR_CACHE_MS = 30_000;
let cachedModel: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;
let rateLimitUntil: number | null = null;
let serviceErrorUntil: number | null = null;

const getGeminiModel = () => {
  if (cachedModel) {
    return cachedModel;
  }

  const { GEMINI_API_KEY } = getServerEnv();
  const client = new GoogleGenerativeAI(GEMINI_API_KEY);
  cachedModel = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });
  return cachedModel;
};

const parseGeminiText = (result: Awaited<ReturnType<typeof getGeminiModel>["generateContent"]>) => {
  const parts = result.response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => {
      if (typeof part === "object" && part && "text" in part) {
        return (part as { text?: string }).text ?? "";
      }
      return "";
    })
    .join("\n")
    .trim();
  return text;
};

const extractStructuredPayload = (text: string): StructuredPayload | undefined => {
  const match = text.match(/```json([\s\S]*?)```/i);
  if (!match) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(match[1].trim());
    return structuredPayloadSchema.parse(parsed);
  } catch (error) {
    logger.warn("Failed to parse structured payload", { error });
    return undefined;
  }
};

const isRateLimitError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = "status" in error ? (error as { status?: number }).status : undefined;
  if (status && [429, 503].includes(status)) {
    return true;
  }

  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return message.toLowerCase().includes("quota") || message.includes("429");
};

export class LlmRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmRateLimitError";
  }
}

export class LlmServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmServiceError";
  }
}

export const generateLlmResponse = async (
  payload: PromptPayload,
): Promise<LlmResult> => {
  const now = Date.now();
  if (rateLimitUntil && now < rateLimitUntil) {
    logger.warn("Gemini call skipped due to cooldown window", {
      rateLimitUntil,
      now,
    });
    throw new LlmRateLimitError("Gemini cooldown active");
  }

  if (serviceErrorUntil && now < serviceErrorUntil) {
    logger.warn("Gemini call skipped due to recent service error", {
      serviceErrorUntil,
      now,
    });
    throw new LlmServiceError("Gemini recently failed");
  }

  const prompt = buildPrompt(payload);
  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = parseGeminiText(response);
    if (!text) {
      throw new LlmServiceError("Gemini 回傳空內容");
    }

    return {
      promptPreview: prompt,
      structured: extractStructuredPayload(text),
      model: GEMINI_MODEL,
      usage: response.response?.usageMetadata
        ? {
            promptTokens: response.response.usageMetadata.promptTokenCount,
            candidatesTokens:
              response.response.usageMetadata.candidatesTokenCount,
            totalTokens: response.response.usageMetadata.totalTokenCount,
          }
        : undefined,
      messages: [{ type: "text", text }],
    };
  } catch (error) {
    if (isRateLimitError(error)) {
      logger.warn("Gemini rate limit encountered", { error });
      rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      serviceErrorUntil = null;
      throw new LlmRateLimitError("Gemini quota reached");
    }

    logger.error("Gemini service failed", { error });
    rateLimitUntil = null;
    serviceErrorUntil = Date.now() + SERVICE_ERROR_CACHE_MS;
    if (error instanceof LlmServiceError) {
      throw error;
    }
    throw new LlmServiceError("Gemini 無法取得有效回覆");
  }
};

