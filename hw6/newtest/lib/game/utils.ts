// 遊戲相關工具函數

/**
 * 格式化道具列表，顯示名稱和數量
 * @param items 道具陣列
 * @returns 格式化後的道具字串，例如 "藥草 * 2, 狼牙"
 */
export function formatItems(items: string[]): string {
  if (items.length === 0) {
    return '無';
  }
  
  // 統計每個道具的數量
  const itemCounts: Record<string, number> = {};
  items.forEach((item) => {
    itemCounts[item] = (itemCounts[item] || 0) + 1;
  });
  
  // 格式化為 "名稱 * 數量" 或 "名稱"（如果只有一個）
  return Object.entries(itemCounts)
    .map(([itemName, count]) => {
      return count > 1 ? `${itemName} * ${count}` : itemName;
    })
    .join(', ');
}

/**
 * 獲取道具數量
 * @param items 道具陣列
 * @param itemName 道具名稱
 * @returns 道具數量
 */
export function getItemCount(items: string[], itemName: string): number {
  return items.filter((item) => item === itemName).length;
}

