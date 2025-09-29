import React, { useState, useEffect, useCallback } from 'react';
import './GamePage.css';
import { BOARD_WIDTH, BOARD_HEIGHT, getLevelSpeed, DROP_SPEED_MULTIPLIERS } from '../utils/gameConstants';
import audioManager from '../utils/audioManager';
import { 
  createEmptyBoard, 
  getRandomPiece, 
  isValidPosition, 
  placePiece, 
  clearLines, 
  calculateScore,
  getGhostPiece,
  rotatePieceWithWallKick
} from '../utils/gameLogic';
import GameBoard from './GameBoard';
import GameInfo from './GameInfo';
import HoldArea from './HoldArea';
import NextPieces from './NextPieces';
import StartGameDialog from './StartGameDialog';
import GameOverDialog from './GameOverDialog';

const GamePage = ({ onBack }) => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieces, setNextPieces] = useState([]);
  const [heldPiece, setHeldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState(null);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [clearingLines, setClearingLines] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [lineClearMessage, setLineClearMessage] = useState(null);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [dropSpeed, setDropSpeed] = useState('medium');
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);

  // 載入設定
  useEffect(() => {
    const savedDropSpeed = localStorage.getItem('dropSpeed');
    if (savedDropSpeed !== null) {
      setDropSpeed(savedDropSpeed);
    }
  }, []);

  // 根據等級選擇背景音樂
  const selectBackgroundMusic = useCallback((level) => {
    let musicKey;
    if (level >= 5) {
      musicKey = 'game2';
    } else {
      musicKey = 'game1';
    }
    
    if (musicKey !== currentMusic) {
      audioManager.playBackgroundMusic(musicKey);
      setCurrentMusic(musicKey);
    }
  }, [currentMusic]);

  // 初始化遊戲
  const initGame = useCallback(() => {
    const initialPieces = Array(5).fill().map(() => getRandomPiece());
    setNextPieces(initialPieces);
    setCurrentPiece(getRandomPiece());
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(0);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setCanHold(true);
    setHeldPiece(null);
    setGameStarted(true);
    setCurrentMusic(null);
    setShowStartDialog(false);
    setShowGameOverDialog(false);
    
    // 開始播放遊戲背景音樂
    selectBackgroundMusic(0);
  }, [selectBackgroundMusic]);

  // 開始遊戲
  const handleStartGame = () => {
    initGame();
  };

  // 重新開始遊戲
  const handleRestartGame = () => {
    initGame();
  };

  // 返回主頁
  const handleBackToMenu = () => {
    setShowGameOverDialog(false);
    onBack();
  };


  // 旋轉方塊
  const rotateCurrentPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    // 使用智能旋轉邏輯（包含牆踢）
    const rotated = rotatePieceWithWallKick(currentPiece, board);
    if (rotated) {
      setCurrentPiece(rotated);
      // 播放旋轉音效
      audioManager.playSound('rotate');
    }
  }, [currentPiece, board, gameOver, isPaused]);

  // 移動方塊到最左邊或最右邊
  const moveToEdge = useCallback((direction) => {
    if (!currentPiece || gameOver || isPaused) return;

    let bestX = currentPiece.x;
    let bestY = currentPiece.y;
    
    if (direction === 'left') {
      // 從最左邊開始測試，找到最左邊能放置的位置
      for (let testX = 0; testX <= currentPiece.x; testX++) {
        // 先嘗試在當前高度放置
        if (isValidPosition({ ...currentPiece, x: testX }, board)) {
          bestX = testX;
          bestY = currentPiece.y;
          // 如果能在最左邊放置，就使用最左邊
          if (testX === 0) break;
        } else {
          // 如果當前高度不能放置，嘗試下降到合適位置
          let foundValidPosition = false;
          for (let testY = currentPiece.y + 1; testY < BOARD_HEIGHT; testY++) {
            if (isValidPosition({ ...currentPiece, x: testX, y: testY }, board)) {
              bestX = testX;
              bestY = testY;
              foundValidPosition = true;
              // 如果能在最左邊放置，就使用最左邊
              if (testX === 0) break;
              break;
            }
          }
          if (testX === 0 && foundValidPosition) break;
        }
      }
    } else if (direction === 'right') {
      // 從當前位置向右測試，找到最右邊能放置的位置
      for (let testX = currentPiece.x; testX < BOARD_WIDTH; testX++) {
        // 先嘗試在當前高度放置
        if (isValidPosition({ ...currentPiece, x: testX }, board)) {
          bestX = testX;
          bestY = currentPiece.y;
        } else {
          // 如果當前高度不能放置，嘗試下降到合適位置
          let foundValidPosition = false;
          for (let testY = currentPiece.y + 1; testY < BOARD_HEIGHT; testY++) {
            if (isValidPosition({ ...currentPiece, x: testX, y: testY }, board)) {
              bestX = testX;
              bestY = testY;
              foundValidPosition = true;
              break;
            }
          }
          // 如果這個X位置無法放置（無論在什麼高度），就停止搜索
          if (!foundValidPosition) {
            break;
          }
        }
      }
    }
    
    setCurrentPiece(prev => ({ ...prev, x: bestX, y: bestY }));
  }, [currentPiece, board, gameOver, isPaused]);

  // 瞬間下降
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let dropDistance = 0;
    let testY = currentPiece.y;
    
    // 計算下降距離
    while (isValidPosition({ ...currentPiece, y: testY + 1 }, board)) {
      testY++;
      dropDistance++;
    }
    
    // 立即將方塊移動到最終位置並放置
    const finalPiece = { ...currentPiece, y: testY };
    setScore(prev => prev + dropDistance * 2); // 瞬間下降獎勵分數
    
    // 直接放置方塊到最終位置
    const newBoard = placePiece(finalPiece, board);
    const { board: clearedBoard, linesCleared, linesToClear } = clearLines(newBoard);
    
    if (linesCleared > 0) {
      // 顯示消除行的特效
      setClearingLines(linesToClear);
      setIsClearing(true);
      
      // 播放消除行音效
      audioManager.playSound('lineClear');
      
      // 顯示消除行提示
      const clearMessages = {
        1: 'Single!',
        2: 'Double!',
        3: 'Triple!',
        4: 'Tetris!'
      };
      setLineClearMessage(clearMessages[linesCleared] || `${linesCleared} Lines!`);
      
      // 延遲清除行，讓特效顯示
      setTimeout(() => {
        setBoard(clearedBoard);
        setIsClearing(false);
        setClearingLines([]);
        setLineClearMessage(null);
        
        const newScore = calculateScore(linesCleared, level);
        setScore(prev => prev + newScore);
        setLines(prev => prev + linesCleared);
        
        // 更新等級
        const newLevel = Math.floor((lines + linesCleared) / 10);
        if (newLevel > level) {
          setLevel(newLevel);
          // 根據新等級切換背景音樂
          selectBackgroundMusic(newLevel);
          // 播放等級提升音效
          audioManager.playSound('levelUp');
          // 顯示等級升等提示
          setLevelUpMessage(`等級提升! ${level} → ${newLevel}`);
          setTimeout(() => setLevelUpMessage(null), 2000);
        }
      }, 500);
    } else {
      setBoard(clearedBoard);
    }
    
    // 生成新方塊 - 直接在這裡實現邏輯，避免依賴問題
    const newPiece = nextPieces[0];
    const newNextPieces = [...nextPieces.slice(1), getRandomPiece()];
    
    setNextPieces(newNextPieces);
    setCurrentPiece(newPiece);
    setCanHold(true);

    // 檢查遊戲結束
    if (!isValidPosition(newPiece, board)) {
      setGameOver(true);
      setShowGameOverDialog(true);
      // 播放遊戲結束音效
      audioManager.playSound('gameOver');
    }
  }, [currentPiece, board, gameOver, isPaused, level, lines, nextPieces, selectBackgroundMusic]);

  // 生成新方塊
  const spawnNewPiece = useCallback(() => {
    const newPiece = nextPieces[0];
    const newNextPieces = [...nextPieces.slice(1), getRandomPiece()];
    
    setNextPieces(newNextPieces);
    setCurrentPiece(newPiece);
    setCanHold(true);

    // 檢查遊戲結束
    if (!isValidPosition(newPiece, board)) {
      setGameOver(true);
      setShowGameOverDialog(true);
      // 播放遊戲結束音效
      audioManager.playSound('gameOver');
    }
  }, [nextPieces, board]);

  // 放置方塊到遊戲板
  const placePieceOnBoard = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = placePiece(currentPiece, board);
    const { board: clearedBoard, linesCleared, linesToClear } = clearLines(newBoard);
    
    if (linesCleared > 0) {
      // 顯示消除行的特效
      setClearingLines(linesToClear);
      setIsClearing(true);
      
      // 播放消除行音效
      audioManager.playSound('lineClear');
      
      // 顯示消除行提示
      const clearMessages = {
        1: 'Single!',
        2: 'Double!',
        3: 'Triple!',
        4: 'Tetris!'
      };
      setLineClearMessage(clearMessages[linesCleared] || `${linesCleared} Lines!`);
      
      // 延遲清除行，讓特效顯示
      setTimeout(() => {
        setBoard(clearedBoard);
        setIsClearing(false);
        setClearingLines([]);
        setLineClearMessage(null);
        
        const newScore = calculateScore(linesCleared, level);
        setScore(prev => prev + newScore);
        setLines(prev => prev + linesCleared);
        
        // 更新等級
        const newLevel = Math.floor((lines + linesCleared) / 10);
        if (newLevel > level) {
          setLevel(newLevel);
          // 根據新等級切換背景音樂
          selectBackgroundMusic(newLevel);
          // 播放等級提升音效
          audioManager.playSound('levelUp');
          // 顯示等級升等提示
          setLevelUpMessage(`等級提升! ${level} → ${newLevel}`);
          setTimeout(() => setLevelUpMessage(null), 2000);
        }
        
        spawnNewPiece();
      }, 500); // 特效持續500ms
    } else {
      setBoard(clearedBoard);
      spawnNewPiece();
    }
  }, [currentPiece, board, level, lines, spawnNewPiece, selectBackgroundMusic]);

  // 移動方塊
  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused) return;

    if (isValidPosition(currentPiece, board, dx, dy)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dy > 0) {
      // 方塊無法繼續下降，放置方塊
      placePieceOnBoard();
    }
  }, [currentPiece, board, gameOver, isPaused, placePieceOnBoard]);

  // 暫存方塊
  const holdPiece = useCallback(() => {
    if (!currentPiece || !canHold || gameOver || isPaused) return;

    if (heldPiece) {
      // 交換當前方塊和暫存方塊
      const newHeldPiece = { ...currentPiece };
      const newCurrentPiece = {
        ...heldPiece,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(heldPiece.shape[0].length / 2),
        y: 0
      };
      setCurrentPiece(newCurrentPiece);
      setHeldPiece(newHeldPiece);
    } else {
      // 暫存當前方塊，生成新方塊
      setHeldPiece({ ...currentPiece });
      spawnNewPiece();
    }
    setCanHold(false);
  }, [currentPiece, heldPiece, canHold, gameOver, isPaused, spawnNewPiece]);

  // 遊戲循環
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || showStartDialog || showGameOverDialog) return;

    const speedMultiplier = DROP_SPEED_MULTIPLIERS[dropSpeed];
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, getLevelSpeed(level, speedMultiplier));

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, level, dropSpeed, showStartDialog, showGameOverDialog, movePiece]);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted) return;

      const key = e.key;
      setPressedKeys(prev => new Set(prev).add(key));

      switch (key) {
        case 'ArrowLeft':
          e.preventDefault();
          // 如果已經按住左鍵，直接移動到最左邊
          if (pressedKeys.has('ArrowLeft')) {
            moveToEdge('left');
          } else {
            movePiece(-1, 0);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          // 如果已經按住右鍵，直接移動到最右邊
          if (pressedKeys.has('ArrowRight')) {
            moveToEdge('right');
          } else {
            movePiece(1, 0);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotateCurrentPiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'Shift':
          e.preventDefault();
          holdPiece();
          break;
        case 'Escape':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, movePiece, rotateCurrentPiece, hardDrop, holdPiece, moveToEdge, pressedKeys]);

  // 遊戲結束時清理音效
  useEffect(() => {
    if (gameOver) {
      // 停止遊戲音樂，但保留選單音樂的記錄
      audioManager.stopBackgroundMusic();
      // 設置選單音樂為下次播放的音樂
      audioManager.lastPlayedMusic = 'menu';
    }
  }, [gameOver]);

  return (
    <div className="game-page">
      <div className="game-background"></div>
      
      <div className="game-container">
        <div className="game-sidebar left">
          <HoldArea heldPiece={heldPiece} />
          <GameInfo 
            score={score} 
            level={level} 
            lines={lines}
            gameOver={gameOver}
            isPaused={isPaused}
            gameStarted={gameStarted}
            onStart={initGame}
          />
        </div>
        
        <div className="game-main">
          <div className="game-header">
            <button className="back-button" onClick={onBack}>
              ↩ 返回主頁
            </button>
            <button className="pause-button" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? '繼續 (ESC)' : '暫停 (ESC)'}
            </button>
          </div>
          
          {levelUpMessage && (
            <div className="level-up-message">
              {levelUpMessage}
            </div>
          )}
          
          {lineClearMessage && (
            <div className="line-clear-message">
              {lineClearMessage}
            </div>
          )}
          
          <GameBoard 
            board={board} 
            currentPiece={currentPiece}
            ghostPiece={currentPiece ? getGhostPiece(currentPiece, board) : null}
            clearingLines={clearingLines}
            isClearing={isClearing}
          />
        </div>
        
        <div className="game-sidebar right">
          <NextPieces pieces={nextPieces.slice(0, 5)} />
        </div>
      </div>
      
      {/* 開始遊戲對話框 */}
      {showStartDialog && (
        <StartGameDialog 
          onStart={handleStartGame}
          onBack={onBack}
        />
      )}
      
      {/* 遊戲結束對話框 */}
      {showGameOverDialog && (
        <GameOverDialog 
          score={score}
          level={level}
          lines={lines}
          onRestart={handleRestartGame}
          onBack={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default GamePage;
