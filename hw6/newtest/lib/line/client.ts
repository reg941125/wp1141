import { Client, ClientConfig } from '@line/bot-sdk';

let clientInstance: Client | null = null;

function getLineClient(): Client {
  if (clientInstance) {
    return clientInstance;
  }

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelAccessToken || !channelSecret) {
    throw new Error('LINE Channel Access Token and Secret must be set in environment variables');
  }

  const config: ClientConfig = {
    channelAccessToken,
    channelSecret,
  };

  clientInstance = new Client(config);
  return clientInstance;
}

// Lazy initialization - only create client when needed
export function getClient(): Client {
  return getLineClient();
}

// For backward compatibility - export a proxy object
export const lineClient = {
  replyMessage: async (replyToken: string, messages: any) => {
    const client = getLineClient();
    return client.replyMessage(replyToken, messages);
  },
  pushMessage: async (userId: string, messages: any) => {
    const client = getLineClient();
    return client.pushMessage(userId, messages);
  },
};

