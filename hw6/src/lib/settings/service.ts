import { getSettingsCollection, assistantSettingsSchema } from "@/lib/db";
import type { AssistantSettingsDocument } from "@/lib/db";
import type { TodoPriority } from "@/lib/llm/types";

export type AssistantSettings = {
  defaultPriority: TodoPriority;
  defaultReminderLeadHours: number;
  updatedAt: Date;
};

const DEFAULT_SETTINGS: AssistantSettings = {
  defaultPriority: "medium",
  defaultReminderLeadHours: 2,
  updatedAt: new Date(0),
};

const mapDocument = (
  doc: AssistantSettingsDocument | null,
): AssistantSettings => {
  if (!doc) {
    return DEFAULT_SETTINGS;
  }
  const parsed = assistantSettingsSchema.parse(doc);
  return {
    defaultPriority: parsed.defaultPriority,
    defaultReminderLeadHours: parsed.defaultReminderLeadHours,
    updatedAt: parsed.updatedAt,
  };
};

export const getAssistantSettings = async (): Promise<AssistantSettings> => {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ key: "assistant" });
  return mapDocument(doc);
};

export const updateAssistantSettings = async (
  updates: Partial<Omit<AssistantSettings, "updatedAt">>,
) => {
  const collection = await getSettingsCollection();
  const current = await getAssistantSettings();

  const next: AssistantSettings = {
    defaultPriority: updates.defaultPriority ?? current.defaultPriority,
    defaultReminderLeadHours:
      updates.defaultReminderLeadHours ?? current.defaultReminderLeadHours,
    updatedAt: new Date(),
  };

  await collection.updateOne(
    { key: "assistant" },
    {
      $set: {
        key: "assistant",
        defaultPriority: next.defaultPriority,
        defaultReminderLeadHours: next.defaultReminderLeadHours,
        updatedAt: next.updatedAt,
      },
    },
    { upsert: true },
  );

  return next;
};

