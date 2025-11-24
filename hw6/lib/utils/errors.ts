export class LLMError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = '請求過於頻繁，請稍後再試') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleLLMError(error: unknown): string {
  if (error instanceof LLMError) {
    if (error.code === '429') {
      return '⚠️ API 請求過於頻繁，請稍後再試。';
    }
    if (error.code === '500' || error.code === '503') {
      return '⚠️ 服務暫時無法使用，請稍後再試。';
    }
    return '⚠️ 生成回應時發生錯誤，請稍後再試。';
  }

  if (error instanceof Error) {
    console.error('LLM Error:', error.message);
  }

  return '⚠️ 發生未知錯誤，請稍後再試。';
}

export function handleDatabaseError(error: unknown): string {
  if (error instanceof DatabaseError) {
    console.error('Database Error:', error.message, error.originalError);
    return '⚠️ 資料庫錯誤，請稍後再試。';
  }

  if (error instanceof Error) {
    console.error('Database Error:', error.message);
  }

  return '⚠️ 資料庫錯誤，請稍後再試。';
}

export function getFallbackMessage(action: string): string {
  const fallbackMessages: Record<string, string> = {
    explore: '你在探索時遇到了一些困難，但沒有發生特別的事情。繼續前進吧！',
    town: '你來到了城鎮，但現在所有商店都關門了。改天再來吧！',
    status: '無法取得狀態資訊，請稍後再試。',
    default: '發生了一些問題，請稍後再試。',
  };

  return fallbackMessages[action] || fallbackMessages.default;
}

