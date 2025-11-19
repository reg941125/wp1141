import { Client } from "@line/bot-sdk";
import { getServerEnv } from "@/lib/env";

let client: Client | null = null;

export const getLineClient = () => {
  if (client) {
    return client;
  }
  const { LINE_CHANNEL_ACCESS_TOKEN } = getServerEnv();
  client = new Client({
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
  });
  return client;
};

