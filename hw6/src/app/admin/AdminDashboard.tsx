"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  AdminMessage,
  DashboardStats,
  SessionSummary,
} from "@/lib/admin/queries";
import type { SessionDetail } from "@/lib/admin/sessions";
import type { AdminLog } from "@/lib/admin/logs";

type TodoView = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  userId: string;
  sessionId: string;
  category?: string;
  updatedAt?: string | null;
};

type SettingsView = {
  defaultPriority: "urgent" | "high" | "medium" | "low";
  defaultReminderLeadHours: number;
  updatedAt?: string;
};

type Props = {
  initialStats: DashboardStats;
  initialSessions: SessionSummary[];
  initialMessages: AdminMessage[];
  initialTodos: TodoView[];
  selectedSessionId: string | null;
  openTodosSnapshot: TodoView[];
  initialDetail: SessionDetail | null;
  initialLogs: AdminLog[];
  initialSettings: SettingsView;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const badgeClass = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-rose-100 text-rose-700";
    case "high":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "已完成";
    case "in_progress":
      return "進行中";
    case "archived":
      return "已歸檔";
    default:
      return "待處理";
  }
};

export default function AdminDashboard({
  initialStats,
  initialSessions,
  initialMessages,
  initialTodos,
  selectedSessionId,
  openTodosSnapshot,
  initialDetail,
  initialLogs,
  initialSettings,
}: Props) {
  const [stats, setStats] = useState(initialStats);
  const [sessions, setSessions] = useState(initialSessions);
  const [messages, setMessages] = useState(initialMessages);
  const [todos, setTodos] = useState(initialTodos);
  const [selectedSession, setSelectedSession] = useState<
    SessionSummary | undefined
  >(initialSessions.find((session) => session.sessionId === selectedSessionId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState("");
  const [openTodos, setOpenTodos] = useState(openTodosSnapshot);
  const [mutatingTodoId, setMutatingTodoId] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDue, setNewTodoDue] = useState("");
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(
    initialDetail,
  );
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSendingPreset, setIsSendingPreset] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [settings, setSettings] = useState(initialSettings);
  const [settingsForm, setSettingsForm] = useState({
    defaultPriority: initialSettings.defaultPriority,
    defaultReminderLeadHours: initialSettings.defaultReminderLeadHours,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!sessionFilter.trim()) {
      return sessions;
    }
    const keyword = sessionFilter.toLowerCase();
    return sessions.filter(
      (session) =>
        session.displayName?.toLowerCase().includes(keyword) ||
        session.userId.toLowerCase().includes(keyword),
    );
  }, [sessionFilter, sessions]);

  const handleError = useCallback((message: string) => {
    setBanner(message);
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Dashboard refresh failed");
      }
      const json = await response.json();
      setStats(json.data.stats);
      setSessions(json.data.sessions);
      setOpenTodos(json.data.todos);
    } catch (error) {
      handleError("無法更新儀表板資料");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [handleError]);

  const loadSessionDetail = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/detail`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("detail fetch failed");
      }
      const json = await response.json();
      setSessionDetail(json.data);
    } catch (error) {
      console.error("Failed to load session detail", error);
    }
  }, []);

  const loadSessionData = useCallback(
    async (session?: SessionSummary) => {
      if (!session) {
        setMessages([]);
        setTodos([]);
        return;
      }
      setIsLoadingSession(true);
      try {
        const [messageRes, todoRes] = await Promise.all([
          fetch(
            `/api/admin/messages?sessionId=${session.sessionId}&limit=60`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/admin/todos?userId=${encodeURIComponent(session.userId)}&status=active&limit=50`,
            { cache: "no-store" },
          ),
        ]);

        if (!messageRes.ok || !todoRes.ok) {
          throw new Error("Unable to load session data");
        }

        const [messageJson, todoJson] = await Promise.all([
          messageRes.json(),
          todoRes.json(),
        ]);
        setMessages(messageJson.data);
        setTodos(todoJson.data);
        loadSessionDetail(session.sessionId);
      } catch (error) {
        handleError("無法載入會話資料");
        console.error(error);
      } finally {
        setIsLoadingSession(false);
      }
    },
    [handleError, loadSessionDetail],
  );

  useEffect(() => {
    if (!sessions.length) {
      return;
    }
    if (!selectedSession) {
      const fallback = sessions[0];
      setSelectedSession(fallback);
      loadSessionData(fallback);
      return;
    }
    const match = sessions.find(
      (session) => session.sessionId === selectedSession.sessionId,
    );
    if (match && match !== selectedSession) {
      setSelectedSession(match);
      return;
    }
    if (!match) {
      const fallback = sessions[0];
      setSelectedSession(fallback);
      loadSessionData(fallback);
    }
  }, [sessions, selectedSession, loadSessionData]);

  useEffect(() => {
    const eventSource = new EventSource("/api/admin/events");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message.recorded") {
          refreshDashboard();
          if (
            selectedSession &&
            data.payload.sessionId === selectedSession.sessionId
          ) {
            loadSessionData(selectedSession);
          }
        }
        if (
          data.type === "todo.mutation" &&
          selectedSession &&
          data.payload.userId === selectedSession.userId
        ) {
          loadSessionData(selectedSession);
        }
      } catch (error) {
        console.error("Failed to process SSE payload", error);
      }
    };
    return () => {
      eventSource.close();
    };
  }, [refreshDashboard, loadSessionData, selectedSession]);

  useEffect(() => {
    setSettingsForm({
      defaultPriority: settings.defaultPriority,
      defaultReminderLeadHours: settings.defaultReminderLeadHours,
    });
  }, [settings]);

  const handleSelectSession = (session: SessionSummary) => {
    setSelectedSession(session);
    loadSessionData(session);
  };

  const handleTodoStatusChange = async (
    todoId: string,
    nextStatus: string,
  ) => {
    setMutatingTodoId(todoId);
    try {
      const response = await fetch(`/api/admin/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        throw new Error("Todo update failed");
      }
      if (selectedSession) {
        await loadSessionData(selectedSession);
      }
    } catch (error) {
      handleError("更新代辦狀態失敗");
      console.error(error);
    } finally {
      setMutatingTodoId(null);
    }
  };

  const handleCreateTodo = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSession || !newTodoTitle.trim()) {
      return;
    }
    setMutatingTodoId("new");
    try {
      const response = await fetch("/api/admin/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
          title: newTodoTitle.trim(),
          dueDate: newTodoDue || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Todo create failed");
      }
      setNewTodoTitle("");
      setNewTodoDue("");
      await loadSessionData(selectedSession);
      await refreshDashboard();
    } catch (error) {
      handleError("新增代辦失敗");
      console.error(error);
    } finally {
      setMutatingTodoId(null);
    }
  };

  const handleAddNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSession || !noteText.trim()) {
      return;
    }
    setIsAddingNote(true);
    try {
      const response = await fetch(
        `/api/admin/sessions/${selectedSession.sessionId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: noteText.trim() }),
        },
      );
      if (!response.ok) {
        throw new Error("note failed");
      }
      const json = await response.json();
      setSessionDetail((prev) =>
        prev ? { ...prev, notes: [...prev.notes, json.data] } : prev,
      );
      setNoteText("");
    } catch (error) {
      handleError("新增註記失敗");
      console.error(error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSendPreset = async (preset: "welcome" | "help" | "custom") => {
    if (!selectedSession) {
      return;
    }
    if (preset === "custom" && !customMessage.trim()) {
      handleError("請輸入自訂訊息內容");
      return;
    }
    setIsSendingPreset(preset);
    try {
      const response = await fetch(
        `/api/admin/sessions/${selectedSession.sessionId}/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preset,
            message: preset === "custom" ? customMessage : undefined,
          }),
        },
      );
      if (!response.ok) {
        throw new Error("resend failed");
      }
      if (preset === "custom") {
        setCustomMessage("");
      }
      await loadSessionData(selectedSession);
    } catch (error) {
      handleError("無法推送訊息");
      console.error(error);
    } finally {
      setIsSendingPreset(null);
    }
  };

  const refreshLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logs", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("logs fetch failed");
      }
      const json = await response.json();
      setLogs(json.data);
    } catch (error) {
      handleError("無法載入錯誤紀錄");
      console.error(error);
    }
  }, [handleError]);

  const handleRetry = async () => {
    if (!selectedSession) {
      return;
    }
    setIsRetrying(true);
    try {
      const response = await fetch(
        `/api/admin/sessions/${selectedSession.sessionId}/retry`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("retry failed");
      }
      await loadSessionData(selectedSession);
      await refreshDashboard();
      await refreshLogs();
    } catch (error) {
      handleError("LLM 重試失敗");
      console.error(error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (!response.ok) {
        throw new Error("settings update failed");
      }
      const json = await response.json();
      setSettings(json.data);
      handleError("設定已更新");
    } catch (error) {
      handleError("無法更新預設設定");
      console.error(error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
            Linea Task Pilot
          </p>
          <h1 className="mt-2 text-3xl font-semibold">後台監控中心</h1>
          <p className="text-sm text-zinc-500">
            監控 LINE 對話、LLM 使用情況與代辦任務狀態
          </p>
        </div>
        <button
          type="button"
          onClick={refreshDashboard}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          disabled={isRefreshing}
        >
          {isRefreshing ? "更新中…" : "重新整理"}
        </button>
      </header>

      {banner ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {banner}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="活躍會話 (24h)"
          value={stats.activeSessions24h}
          subtitle={`總用戶 ${stats.totalUsers}`}
        />
        <StatsCard
          title="LLM 成功率"
          value={`${Math.round(stats.llmSuccessRate * 100)}%`}
          subtitle={`請求 ${stats.llmRequests24h} / RL ${stats.rateLimitCount24h}`}
        />
        <StatsCard
          title="平均回應延遲"
          value={stats.avgLlmLatencyMs ? `${stats.avgLlmLatencyMs}ms` : "-"}
          subtitle={`訊息量 ${stats.messageVolume24h}`}
        />
        <StatsCard
          title="代辦完成率"
          value={`${Math.round(stats.todoCompletionRate * 100)}%`}
          subtitle={`待處理 ${stats.openTodos}`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">會話列表</h2>
            <span className="text-xs text-zinc-500">
              {sessions.length} 位使用者
            </span>
          </div>
          <input
            className="mt-4 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="搜尋使用者或 Session"
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
          />
          <div className="mt-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 480 }}>
            {filteredSessions.map((session) => {
              const isActive =
                selectedSession?.sessionId === session.sessionId;
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => handleSelectSession(session)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 bg-white hover:border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {session.displayName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {session.userId.slice(-8)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span>入 {session.inboundCount}</span>
                    <span>出 {session.outboundCount}</span>
                    {session.fallbackCount > 0 ? (
                      <span className="text-rose-500">
                        Fallback {session.fallbackCount}
                      </span>
                    ) : null}
                    {session.active ? (
                      <span className="text-emerald-600">online</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-zinc-500">沒有符合的會話</p>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  對話記錄
                </h2>
                <p className="text-sm text-zinc-500">
                  {selectedSession
                    ? `${selectedSession.displayName} · ${selectedSession.userId}`
                    : "尚未選擇會話"}
                </p>
              </div>
              {isLoadingSession ? (
                <span className="text-xs text-zinc-500">載入中…</span>
              ) : null}
            </div>
            <div className="mt-4 space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  尚無訊息紀錄，請選擇左側會話。
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  營運工具
                </h2>
                <p className="text-sm text-zinc-500">
                  LLM 重試、錯誤紀錄與預設設定
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  onClick={refreshLogs}
                >
                  重新整理 Logs
                </button>
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  onClick={handleRetry}
                  disabled={!selectedSession || isRetrying}
                >
                  {isRetrying ? "重試中…" : "重試上一則 LLM"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  近期錯誤
                </h3>
                <div className="mt-3 space-y-3">
                  {logs.slice(0, 6).map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span
                          className={
                            log.level === "error"
                              ? "text-rose-500"
                              : log.level === "warn"
                                ? "text-amber-600"
                                : "text-zinc-500"
                          }
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-zinc-800">{log.message}</p>
                    </div>
                  ))}
                  {logs.length === 0 ? (
                    <p className="text-sm text-zinc-500">無錯誤紀錄。</p>
                  ) : null}
                </div>
              </div>

              <form className="text-sm" onSubmit={handleSaveSettings}>
                <h3 className="text-sm font-semibold text-zinc-900">
                  預設設定
                </h3>
                <label className="mt-3 block text-xs font-semibold text-zinc-500">
                  預設優先級
                </label>
                <select
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2"
                  value={settingsForm.defaultPriority}
                  onChange={(event) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      defaultPriority:
                        event.target.value as SettingsView["defaultPriority"],
                    }))
                  }
                >
                  {["urgent", "high", "medium", "low"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-xs font-semibold text-zinc-500">
                  提前提醒 (小時)
                </label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2"
                  value={settingsForm.defaultReminderLeadHours}
                  onChange={(event) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      defaultReminderLeadHours: Number(event.target.value),
                    }))
                  }
                />
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? "儲存中…" : "儲存設定"}
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  會話細節
                </h2>
                <p className="text-sm text-zinc-500">
                  註記、快速推播與使用者資訊
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => handleSendPreset("welcome")}
                  className="rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  disabled={!selectedSession || isSendingPreset === "welcome"}
                >
                  {isSendingPreset === "welcome" ? "推送中…" : "重送歡迎"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPreset("help")}
                  className="rounded-full border border-sky-200 px-4 py-2 font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                  disabled={!selectedSession || isSendingPreset === "help"}
                >
                  {isSendingPreset === "help" ? "推送中…" : "推送指引"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p>
                  使用者：{" "}
                  <span className="font-semibold">
                    {sessionDetail?.displayName ?? "n/a"}
                  </span>
                </p>
                <p>語系：{sessionDetail?.language ?? "未知"}</p>
                <p>開始：{formatDate(sessionDetail?.startedAt)}</p>
                <p>最近：{formatDate(sessionDetail?.lastActivityAt)}</p>
                <p>標籤：{sessionDetail?.tags.join("、") || "無"}</p>
              </div>

              <form
                className="rounded-2xl border border-zinc-100 p-4 text-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSendPreset("custom");
                }}
              >
                <label className="text-xs font-semibold text-zinc-500">
                  自訂推播訊息
                </label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-3 py-2"
                  rows={3}
                  value={customMessage}
                  onChange={(event) => setCustomMessage(event.target.value)}
                  placeholder="輸入要推播給使用者的文字"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
                  disabled={
                    !selectedSession ||
                    !customMessage.trim() ||
                    isSendingPreset === "custom"
                  }
                >
                  {isSendingPreset === "custom" ? "推送中…" : "送出訊息"}
                </button>
              </form>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">註記</h3>
                <span className="text-xs text-zinc-500">
                  {sessionDetail?.notes.length ?? 0} 則
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {sessionDetail?.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2 text-sm text-zinc-700"
                  >
                    <p>{note.text}</p>
                    <p className="text-xs text-zinc-500">
                      {note.author} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
                {!sessionDetail?.notes.length ? (
                  <p className="text-sm text-zinc-500">尚無註記。</p>
                ) : null}
              </div>
              <form className="mt-3 flex gap-2" onSubmit={handleAddNote}>
                <input
                  className="flex-1 rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="新增註記"
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  disabled={!selectedSession}
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!selectedSession || isAddingNote}
                >
                  {isAddingNote ? "儲存中…" : "新增"}
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  代辦任務
                </h2>
                <p className="text-sm text-zinc-500">自動推論 + 手動管理</p>
              </div>
              <form
                onSubmit={handleCreateTodo}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <input
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                  placeholder="新增任務"
                  value={newTodoTitle}
                  onChange={(event) => setNewTodoTitle(event.target.value)}
                  disabled={!selectedSession}
                />
                <input
                  type="date"
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                  value={newTodoDue}
                  onChange={(event) => setNewTodoDue(event.target.value)}
                  disabled={!selectedSession}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  disabled={!selectedSession || mutatingTodoId === "new"}
                >
                  {mutatingTodoId === "new" ? "新增中…" : "新增"}
                </button>
              </form>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500">
                    <th className="py-2">任務</th>
                    <th className="py-2">狀態</th>
                    <th className="py-2">優先</th>
                    <th className="py-2">截止</th>
                    <th className="py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((todo) => (
                    <tr
                      key={todo.id}
                      className="border-t border-zinc-100 text-zinc-800"
                    >
                      <td className="py-3">
                        <p className="font-medium">{todo.title}</p>
                        <p className="text-xs text-zinc-500">
                          {todo.category ?? "general"}
                        </p>
                      </td>
                      <td className="py-3 text-xs text-zinc-500">
                        {statusLabel(todo.status)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                            todo.priority,
                          )}`}
                        >
                          {todo.priority}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-zinc-500">
                        {formatDate(todo.dueDate)}
                      </td>
                      <td className="py-3 text-right text-xs">
                        {todo.status !== "completed" ? (
                          <button
                            type="button"
                            className="rounded-full border border-emerald-200 px-3 py-1 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                            onClick={() =>
                              handleTodoStatusChange(todo.id, "completed")
                            }
                            disabled={mutatingTodoId === todo.id}
                          >
                            {mutatingTodoId === todo.id
                              ? "更新中…"
                              : "標示完成"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-full border border-zinc-200 px-3 py-1 font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                            onClick={() =>
                              handleTodoStatusChange(todo.id, "archived")
                            }
                            disabled={mutatingTodoId === todo.id}
                          >
                            {mutatingTodoId === todo.id
                              ? "更新中…"
                              : "歸檔"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {todos.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  尚無代辦項目。可從會話中以自然語言建立，或於此手動新增。
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              全域待辦快照
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {openTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-zinc-900">{todo.title}</p>
                  <p className="text-xs text-zinc-500">
                    {statusLabel(todo.status)} · {todo.userId.slice(-6)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span
                      className={`rounded-full px-2 py-1 ${badgeClass(todo.priority)}`}
                    >
                      {todo.priority}
                    </span>
                    <span>{formatDate(todo.dueDate)}</span>
                  </div>
                </div>
              ))}
              {openTodos.length === 0 ? (
                <p className="text-sm text-zinc-500">目前無待辦快照。</p>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

const StatsCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) => (
  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-xs uppercase text-zinc-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    <p className="text-xs text-zinc-500">{subtitle}</p>
  </div>
);

const MessageBubble = ({ message }: { message: AdminMessage }) => {
  const isInbound = message.direction === "inbound";
  const tone = isInbound
    ? "border-sky-200 bg-sky-50"
    : "border-emerald-200 bg-emerald-50";
  const text =
    typeof message.payload?.text === "string"
      ? message.payload.text
      : JSON.stringify(message.payload, null, 2);
  const metadata = (message.metadata ?? {}) as {
    fallbackReason?: string;
    mutations?: Array<Record<string, unknown>>;
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{isInbound ? "使用者" : "助理"}</span>
        <span>{formatDate(message.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-zinc-800">{text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        {message.llmLatencyMs ? (
          <span>LLM {message.llmLatencyMs}ms</span>
        ) : null}
        {metadata.fallbackReason ? (
          <span className="text-rose-500">
            降級：{metadata.fallbackReason}
          </span>
        ) : null}
        {Array.isArray(metadata.mutations) && metadata.mutations.length ? (
          <span className="text-emerald-700">
            {metadata.mutations.length} 個任務更新
          </span>
        ) : null}
      </div>
    </div>
  );
};

