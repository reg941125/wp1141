import {
  fetchDashboardStats,
  fetchOpenTodos,
  fetchRecentSessions,
  fetchSessionMessages,
  formatTodoDocuments,
} from "@/lib/admin/queries";
import { fetchSessionDetail } from "@/lib/admin/sessions";
import { fetchAdminLogs } from "@/lib/admin/logs";
import { getAssistantSettings } from "@/lib/settings/service";
import { listTodos } from "@/lib/todos/service";

import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, sessions, openTodos, logs, settings] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentSessions(12),
    fetchOpenTodos(8),
    fetchAdminLogs(30),
    getAssistantSettings(),
  ]);
  const settingsView = {
    defaultPriority: settings.defaultPriority,
    defaultReminderLeadHours: settings.defaultReminderLeadHours,
    updatedAt: settings.updatedAt.toISOString(),
  };

  const selectedSession = sessions[0];

  const [messages, userTodos, detail] = selectedSession
    ? await Promise.all([
        fetchSessionMessages(selectedSession.sessionId, 60),
        listTodos({
          userId: selectedSession.userId,
          status: "active",
          limit: 50,
        }),
        fetchSessionDetail(selectedSession.sessionId),
      ])
    : [[], [], null];

  return (
    <AdminDashboard
      initialStats={stats}
      initialSessions={sessions}
      initialMessages={messages}
      initialTodos={formatTodoDocuments(userTodos)}
      selectedSessionId={selectedSession?.sessionId ?? null}
      openTodosSnapshot={openTodos}
      initialLogs={logs}
      initialSettings={settingsView}
      initialDetail={detail}
    />
  );
}

