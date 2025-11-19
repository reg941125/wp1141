import { getAdminLogsCollection } from "@/lib/db";
import { adminLogSchema } from "@/lib/db";

export type AdminLog = {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
};

export const recordAdminLog = async ({
  level,
  message,
  context,
}: {
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
}) => {
  try {
    const logs = await getAdminLogsCollection();
    const doc = adminLogSchema.parse({
      level,
      message,
      context,
      createdAt: new Date(),
    });
    await logs.insertOne(doc);
  } catch (error) {
    console.error("Failed to record admin log", error);
  }
};

export const fetchAdminLogs = async (limit = 40): Promise<AdminLog[]> => {
  const logs = await getAdminLogsCollection();
  const docs = await logs
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((doc) => ({
    id: doc._id?.toString() ?? "",
    level: doc.level,
    message: doc.message,
    context: doc.context,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
};

