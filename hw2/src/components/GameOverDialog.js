import React from 'react';
import './GameOverDialog.css';

const GameOverDialog = ({ score, level, lines, onRestart, onBack }) => {
  return (
    <div className="dialog-overlay">
      <div className="game-over-dialog">
        <h2 className="dialog-title">遊戲結束</h2>
        
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">分數</span>
            <span className="score-value">{score.toLocaleString()}</span>
          </div>
          <div className="score-item">
            <span className="score-label">等級</span>
            <span className="score-value">{level}</span>
          </div>
          <div className="score-item">
            <span className="score-label">消除行數</span>
            <span className="score-value">{lines}</span>
          </div>
        </div>

        <div className="dialog-buttons">
          <button className="restart-button" onClick={onRestart}>
            重新開始
          </button>
          <button className="back-button" onClick={onBack}>
            返回主頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverDialog;

