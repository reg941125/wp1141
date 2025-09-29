import { BOARD_WIDTH, BOARD_HEIGHT, TETRIS_PIECES, PIECE_TYPES, SCORE_VALUES } from './gameConstants';

// 創建空的遊戲板
export const createEmptyBoard = () => {
  return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
};

// 隨機生成方塊
export const getRandomPiece = () => {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    shape: TETRIS_PIECES[type].shape,
    color: TETRIS_PIECES[type].color,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETRIS_PIECES[type].shape[0].length / 2),
    y: 0
  };
};

// 旋轉方塊
export const rotatePiece = (piece) => {
  const rotated = piece.shape[0].map((_, index) =>
    piece.shape.map(row => row[index]).reverse()
  );
  return {
    ...piece,
    shape: rotated
  };
};

// 智能旋轉方塊（包含牆踢邏輯）
export const rotatePieceWithWallKick = (piece, board) => {
  const rotated = rotatePiece(piece);
  
  // 如果旋轉後位置有效，直接返回
  if (isValidPosition(rotated, board)) {
    return rotated;
  }
  
  // 嘗試牆踢：向左移動1格
  const kickLeft = { ...rotated, x: rotated.x - 1 };
  if (isValidPosition(kickLeft, board)) {
    return kickLeft;
  }
  
  // 嘗試牆踢：向右移動1格
  const kickRight = { ...rotated, x: rotated.x + 1 };
  if (isValidPosition(kickRight, board)) {
    return kickRight;
  }
  
  // 嘗試牆踢：向左移動2格
  const kickLeft2 = { ...rotated, x: rotated.x - 2 };
  if (isValidPosition(kickLeft2, board)) {
    return kickLeft2;
  }
  
  // 嘗試牆踢：向右移動2格
  const kickRight2 = { ...rotated, x: rotated.x + 2 };
  if (isValidPosition(kickRight2, board)) {
    return kickRight2;
  }
  
  // 特殊處理I形方塊：更積極的牆踢
  if (piece.type === 'I') {
    // I形方塊從水平變垂直時，需要更大的調整
    const kickLeft3 = { ...rotated, x: rotated.x - 3 };
    if (isValidPosition(kickLeft3, board)) {
      return kickLeft3;
    }
    
    const kickRight3 = { ...rotated, x: rotated.x + 3 };
    if (isValidPosition(kickRight3, board)) {
      return kickRight3;
    }
  }
  
  // 如果所有牆踢都失敗，返回null表示無法旋轉
  return null;
};

// 檢查方塊是否可以放置在指定位置
export const isValidPosition = (piece, board, dx = 0, dy = 0) => {
  const newX = piece.x + dx;
  const newY = piece.y + dy;

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = newX + x;
        const boardY = newY + y;

        // 檢查邊界
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return false;
        }

        // 檢查是否與已放置的方塊重疊
        if (boardY >= 0 && board[boardY][boardX]) {
          return false;
        }
      }
    }
  }
  return true;
};

// 將方塊放置到遊戲板上
export const placePiece = (piece, board) => {
  const newBoard = board.map(row => [...row]);
  
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.color;
        }
      }
    }
  }
  return newBoard;
};

// 檢查並清除完整的行
export const clearLines = (board) => {
  const linesToClear = [];
  const newBoard = [];
  
  // 找出需要清除的行
  for (let y = 0; y < board.length; y++) {
    if (board[y].every(cell => cell !== 0)) {
      linesToClear.push(y);
    } else {
      newBoard.push([...board[y]]);
    }
  }
  
  // 在頂部添加空行
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return {
    board: newBoard,
    linesCleared: linesToClear.length,
    linesToClear
  };
};

// 計算分數
export const calculateScore = (linesCleared, level) => {
  if (linesCleared === 0) return 0;
  
  let baseScore = 0;
  switch (linesCleared) {
    case 1: baseScore = SCORE_VALUES.SINGLE; break;
    case 2: baseScore = SCORE_VALUES.DOUBLE; break;
    case 3: baseScore = SCORE_VALUES.TRIPLE; break;
    case 4: baseScore = SCORE_VALUES.TETRIS; break;
    default: baseScore = linesCleared * SCORE_VALUES.SINGLE;
  }
  
  return baseScore * (level + 1);
};

// 獲取鬼影方塊位置
export const getGhostPiece = (piece, board) => {
  let ghostY = piece.y;
  
  while (isValidPosition({ ...piece, y: ghostY + 1 }, board)) {
    ghostY++;
  }
  
  return {
    ...piece,
    y: ghostY,
    isGhost: true
  };
};
