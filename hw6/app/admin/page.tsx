'use client';

import { useEffect, useState } from 'react';

interface Conversation {
  _id: string;
  userId: string;
  messageId: string;
  timestamp: Date;
  messageType: string;
  content: string;
  response?: string;
}

interface User {
  userId: string;
  conversationCount?: number;
  lastActivity?: Date | null;
  gameState?: {
    level: number;
    attack: number;
    currentHP: number;
    maxHP: number;
    gold: number;
    experience: number;
    items: string[];
    gameCompleted: boolean;
  } | null;
}

interface Stats {
  overview: {
    totalConversations: number;
    uniqueUsers: number;
    activeUsers: number;
    totalGameStates: number;
    completedGames: number;
    completionRate: number;
    recentConversations: number;
  };
  conversationsByType: Record<string, number>;
  gameStats: {
    averageHP: number;
    averageGold: number;
  };
}

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (userIdFilter) {
        params.append('userId', userIdFilter);
      }

      const response = await fetch(`/api/conversations?${params}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?includeStats=true');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserConversations = async (userId: string) => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}&limit=1000`);
      const data = await response.json();
      // Sort by timestamp ascending for chronological order
      const sorted = (data.conversations || []).sort(
        (a: Conversation, b: Conversation) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setUserConversations(sorted);
    } catch (error) {
      console.error('Error fetching user conversations:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDialog(true);
    fetchUserConversations(userId);
  };

  const handleSendMessage = async () => {
    if (!selectedUserId || !messageInput.trim()) {
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          message: messageInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageInput('');
        // Refresh conversations to show the sent message
        setTimeout(() => {
          fetchUserConversations(selectedUserId);
        }, 1000);
        alert('訊息已成功發送！');
      } else {
        alert(`發送失敗: ${data.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('發送訊息時發生錯誤');
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchStats(), fetchUsers()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userIdFilter]);

  useEffect(() => {
    if (selectedUserId && showUserDialog) {
      fetchUserConversations(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, showUserDialog]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-TW');
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">LINE RPG Bot 管理後台</h1>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">總對話數</h3>
              <p className="text-2xl font-bold mt-2">{stats.overview.totalConversations}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">總用戶數</h3>
              <p className="text-2xl font-bold mt-2">{stats.overview.uniqueUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">活躍用戶 (24h)</h3>
              <p className="text-2xl font-bold mt-2">{stats.overview.activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">遊戲完成率</h3>
              <p className="text-2xl font-bold mt-2">
                {stats.overview.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">選擇用戶查看對話</label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  if (e.target.value) {
                    handleUserSelect(e.target.value);
                  } else {
                    setSelectedUserId('');
                    setShowUserDialog(false);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- 選擇用戶 --</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.userId.substring(0, 12)}... ({user.conversationCount || 0} 則對話
                    {user.gameState?.gameCompleted ? ' ✓完成' : ''})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">篩選用戶 ID（搜尋）</label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                placeholder="輸入用戶 ID 搜尋..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-end gap-4">
              <button
                onClick={() => {
                  setLoading(true);
                  Promise.all([
                    fetchConversations(),
                    fetchStats(),
                    fetchUsers(),
                    selectedUserId ? fetchUserConversations(selectedUserId) : Promise.resolve(),
                  ]).finally(() => {
                    setLoading(false);
                  });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                重新整理
              </button>
            </div>
          </div>
        </div>

        {/* User Conversation Dialog */}
        {showUserDialog && selectedUserId && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">用戶對話記錄</h2>
                <p className="text-sm text-gray-500 mt-1">
                  用戶 ID: {selectedUserId}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserDialog(false);
                  setSelectedUserId('');
                  setMessageInput('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ✕ 關閉
              </button>
            </div>
            {/* Player Status Card */}
            {users.find((u) => u.userId === selectedUserId)?.gameState && (
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">📊 玩家狀態</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">⭐ 等級</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.level || 1}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">⚔️ 攻擊力</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.attack || 10}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">❤️ HP</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.currentHP}/
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.maxHP}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">💰 金幣</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.gold}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">✨ 經驗值</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.experience || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">🎒 道具數量</div>
                    <div className="text-xl font-bold text-gray-800">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.items?.length || 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm col-span-2">
                    <div className="text-xs text-gray-500 mb-1">🎒 道具列表</div>
                    <div className="text-sm font-medium text-gray-800 break-words">
                      {users.find((u) => u.userId === selectedUserId)?.gameState?.items?.join(', ') || '無'}
                    </div>
                  </div>
                  {users.find((u) => u.userId === selectedUserId)?.gameState?.gameCompleted && (
                    <div className="bg-green-100 p-3 rounded-lg shadow-sm col-span-2">
                      <div className="text-xs text-green-700 mb-1">🎉 遊戲狀態</div>
                      <div className="text-sm font-bold text-green-800">已完成遊戲</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="p-6 max-h-96 overflow-y-auto">
              {userConversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">沒有對話記錄</div>
              ) : (
                <div className="space-y-4">
                  {userConversations.map((conv, index) => (
                    <div key={conv._id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(conv.timestamp)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {conv.messageType}
                        </span>
                      </div>
                      {conv.messageType === 'text' && !conv.response && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-2">
                          <div className="text-sm font-medium text-blue-900 mb-1">用戶</div>
                          <div className="text-gray-800 whitespace-pre-wrap">{conv.content}</div>
                        </div>
                      )}
                      {conv.messageType === 'postback' && (
                        <div className="bg-purple-50 p-3 rounded-lg mb-2">
                          <div className="text-sm font-medium text-purple-900 mb-1">用戶操作</div>
                          <div className="text-gray-800">{conv.content}</div>
                        </div>
                      )}
                      {conv.response && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-green-900 mb-1">Bot 回應</div>
                          <div className="text-gray-800 whitespace-pre-wrap">{conv.response}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Send Message Section */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="輸入要發送給用戶的訊息..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? '發送中...' : '發送'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                提示：按 Enter 鍵快速發送訊息
              </p>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">對話紀錄</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用戶 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    類型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    內容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    回應
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      沒有對話紀錄
                    </td>
                  </tr>
                ) : (
                  conversations.map((conv) => (
                    <tr key={conv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(conv.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {conv.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {conv.messageType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {conv.content}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                        {conv.response || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            <span className="text-sm text-gray-500">第 {page} 頁</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={conversations.length < 50}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

