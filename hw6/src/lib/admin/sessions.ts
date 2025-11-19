import { randomUUID } from "node:crypto";

import {
  getSessionsCollection,
  getUsersCollection,
  type SessionDocument,
} from "@/lib/db";

export type SessionNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type SessionDetail = {
  sessionId: string;
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  language?: string;
  startedAt?: string;
  lastActivityAt?: string;
  tags: string[];
  notes: SessionNote[];
};

const normalizeNotes = (session: SessionDocument): SessionNote[] => {
  const rawNotes = (session.metadata as { notes?: SessionNote[] } | undefined)
    ?.notes;
  if (!Array.isArray(rawNotes)) {
    return [];
  }
  return rawNotes.map((note) => ({
    ...note,
    createdAt: note.createdAt ?? new Date().toISOString(),
  }));
};

export const fetchSessionDetail = async (
  sessionId: string,
): Promise<SessionDetail> => {
  const [sessions, users] = await Promise.all([
    getSessionsCollection(),
    getUsersCollection(),
  ]);

  const session = await sessions.findOne({ sessionId });
  if (!session) {
    throw new Error("Session not found");
  }

  const user = await users.findOne({ lineUserId: session.userId });

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    displayName: user?.displayName ?? session.userId,
    pictureUrl: user?.pictureUrl,
    language: user?.language,
    startedAt: session.startedAt?.toISOString(),
    lastActivityAt: session.lastActivityAt?.toISOString(),
    tags: session.tags ?? [],
    notes: normalizeNotes(session),
  };
};

export const appendSessionNote = async ({
  sessionId,
  text,
  author,
}: {
  sessionId: string;
  text: string;
  author: string;
}) => {
  const sessions = await getSessionsCollection();
  const note: SessionNote = {
    id: randomUUID(),
    text,
    author,
    createdAt: new Date().toISOString(),
  };

  const updateResult = await sessions.findOneAndUpdate(
    { sessionId },
    {
      $push: { "metadata.notes": note },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );

  if (!updateResult.value) {
    throw new Error("Session not found");
  }

  return note;
};

