// 遊戲板大小
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// 方塊類型定義
export const TETRIS_PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF' // 青色
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00' // 黃色
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#800080' // 紫色
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00' // 綠色
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000' // 紅色
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF' // 藍色
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FFA500' // 橙色
  }
};

// 方塊類型列表
export const PIECE_TYPES = Object.keys(TETRIS_PIECES);

// 計分系統
export const SCORE_VALUES = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
  SOFT_DROP: 1
};

// 等級系統 - 更快的速度變化
export const LEVEL_SPEEDS = [
  800,  // 等級 0 - 0.8秒
  700,  // 等級 1 - 0.7秒
  600,  // 等級 2 - 0.6秒
  500,  // 等級 3 - 0.5秒
  400,  // 等級 4 - 0.4秒
  350,  // 等級 5 - 0.35秒
  300,  // 等級 6 - 0.3秒
  250,  // 等級 7 - 0.25秒
  200,  // 等級 8 - 0.2秒
  180,  // 等級 9 - 0.18秒
  160,  // 等級 10 - 0.16秒
  140,  // 等級 11 - 0.14秒
  120,  // 等級 12 - 0.12秒
  100,  // 等級 13 - 0.1秒
  90,   // 等級 14 - 0.09秒
  80,   // 等級 15 - 0.08秒
  70,   // 等級 16 - 0.07秒
  60,   // 等級 17 - 0.06秒
  50,   // 等級 18 - 0.05秒
  40,   // 等級 19 - 0.04秒
  30,   // 等級 20+ - 0.03秒 (最快)
];

// 獲取指定等級的下降速度
export const getLevelSpeed = (level, speedMultiplier = 1) => {
  const speedIndex = Math.min(level, LEVEL_SPEEDS.length - 1);
  const baseSpeed = LEVEL_SPEEDS[speedIndex];
  return Math.max(30, baseSpeed / speedMultiplier); // 最快不超過30ms
};

// 掉落速度倍數設定
export const DROP_SPEED_MULTIPLIERS = {
  slow: 0.5,    // 慢速：0.5倍
  medium: 1,    // 中速：1倍（預設）
  fast: 2       // 快速：2倍
};
