import { z } from "zod";

const serverSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1, "Missing LINE channel secret"),
  LINE_CHANNEL_ACCESS_TOKEN: z
    .string()
    .min(1, "Missing LINE channel access token"),
  LINE_WEBHOOK_BASE_URL: z
    .string()
    .url("LINE webhook base URL must be a valid https URL"),
  GEMINI_API_KEY: z.string().min(1, "Missing Gemini API key"),
  MONGODB_URI: z.string().min(1, "Missing MongoDB URI"),
  MONGODB_DB_NAME: z.string().min(1, "Missing MongoDB database name"),
  ADMIN_BASIC_AUTH_USER: z.string().min(1, "Missing admin user"),
  ADMIN_BASIC_AUTH_PASS: z.string().min(1, "Missing admin password"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Linea Task Pilot"),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

declare global {
  var __ENV_CACHE__: ServerEnv | undefined;
}

export const getServerEnv = (): ServerEnv => {
  if (global.__ENV_CACHE__) {
    return global.__ENV_CACHE__;
  }

  const parsed = serverSchema.safeParse({
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_WEBHOOK_BASE_URL: process.env.LINE_WEBHOOK_BASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    ADMIN_BASIC_AUTH_USER: process.env.ADMIN_BASIC_AUTH_USER,
    ADMIN_BASIC_AUTH_PASS: process.env.ADMIN_BASIC_AUTH_PASS,
  });

  if (!parsed.success) {
    console.error(
      "Invalid or missing environment variables",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment configuration");
  }

  global.__ENV_CACHE__ = parsed.data;
  return parsed.data;
};

export const getClientEnv = (): ClientEnv => {
  return clientSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });
};

export const PUBLIC_APP_NAME = getClientEnv().NEXT_PUBLIC_APP_NAME;



