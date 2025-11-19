import { MongoClient } from "mongodb";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

declare global {
  var __MONGO_CLIENT_PROMISE__: Promise<MongoClient> | undefined;
}

let cachedClientPromise: Promise<MongoClient> | undefined = undefined;

const createMongoClient = () => {
  const { MONGODB_URI } = getServerEnv();
  return new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
  });
};

export const getMongoClient = async () => {
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  if (!global.__MONGO_CLIENT_PROMISE__) {
    const client = createMongoClient();
    global.__MONGO_CLIENT_PROMISE__ = client.connect().then((connected) => {
      logger.info("MongoDB connected");
      return connected;
    });
  }

  cachedClientPromise = global.__MONGO_CLIENT_PROMISE__;
  return cachedClientPromise!;
};

export const getMongoDatabase = async () => {
  const { MONGODB_DB_NAME } = getServerEnv();
  const client = await getMongoClient();
  return client.db(MONGODB_DB_NAME);
};

