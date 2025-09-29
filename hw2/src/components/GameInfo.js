import React from 'react';
import './GameInfo.css';

const GameInfo = ({ score, level, lines, gameOver, isPaused, gameStarted, onStart }) => {
  if (!gameStarted) {
    return (
      <div className="game-info">
        <div className="start-screen">
          <h2>準備開始遊戲</h2>
          <button className="start-game-button" onClick={onStart}>
            開始遊戲
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="game-info">
        <div className="game-over-screen">
          <h2>遊戲結束</h2>
          <div className="final-score">
            <div>最終分數: {score.toLocaleString()}</div>
            <div>最高等級: {level}</div>
            <div>消除行數: {lines}</div>
          </div>
          <button className="restart-button" onClick={onStart}>
            重新開始
          </button>
        </div>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div className="game-info">
        <div className="pause-screen">
          <h2>遊戲暫停</h2>
          <p>按 ESC 鍵繼續遊戲</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-info">
      <div className="score-info">
        <div className="score-item">
          <span className="score-label">分數</span>
          <span className="score-value">{score.toLocaleString()}</span>
        </div>
        <div className="score-item">
          <span className="score-label">等級</span>
          <span className="score-value">{level}</span>
        </div>
        <div className="score-item">
          <span className="score-label">行數</span>
          <span className="score-value">{lines}</span>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
