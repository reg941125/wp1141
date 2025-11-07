'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HiTrash } from 'react-icons/hi2';

const ADMIN_KEY = 'regp0o9i8u7';

interface User {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
    likes: number;
    reposts: number;
  };
}

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const key = params?.key as string;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (key !== ADMIN_KEY) {
      setError('無效的訪問金鑰');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [key]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?key=${ADMIN_KEY}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || '無法載入用戶列表');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('載入用戶列表時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`確定要刪除用戶 ${userId} 嗎？此操作無法復原！`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}?key=${ADMIN_KEY}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        // Remove user from list
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        alert(data.error || '刪除用戶失敗');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('刪除用戶時發生錯誤');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (key !== ADMIN_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">無效的訪問金鑰</h1>
          <p className="mt-2 text-gray-600">您沒有權限訪問此頁面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理後台</h1>
          <p className="mt-2 text-gray-600">用戶管理系統</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg text-gray-500">載入中...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      註冊時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      統計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        尚無用戶
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 text-sm font-medium">
                                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || '未設定名稱'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.userId ? `@${user.userId}` : '未設定'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email || '無'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            貼文: {user._count.posts} | 留言: {user._count.comments} | 
                            按讚: {user._count.likes} | 轉發: {user._count.reposts}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            <HiTrash className="w-4 h-4" />
                            <span>{deletingUserId === user.id ? '刪除中...' : '刪除'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

