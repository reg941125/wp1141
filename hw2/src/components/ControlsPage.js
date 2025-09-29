import React, { useEffect } from 'react';
import './ControlsPage.css';
import audioManager from '../utils/audioManager';

const ControlsPage = ({ onBack }) => {
  useEffect(() => {
    // 只在沒有播放選單音樂時才播放
    if (!audioManager.isPlayingMenuMusic()) {
      audioManager.playBackgroundMusic('menu');
    }
    
    // 清理函數：不停止音樂，讓音樂持續播放
    return () => {
      // 不在此處停止音樂，讓音樂持續播放
    };
  }, []);

  return (
    <div className="controls-page">
      <div className="game-background"></div>
      <div className="controls-content">
        <h1 className="controls-title">按鍵介紹</h1>
        <div className="controls-grid">
          <div className="control-item">
            <div className="key">← →</div>
            <div className="description">左右移動 (按住直接到邊緣)</div>
          </div>
          <div className="control-item">
            <div className="key">↓</div>
            <div className="description">快速下降</div>
          </div>
          <div className="control-item">
            <div className="key">↑</div>
            <div className="description">旋轉方塊</div>
          </div>
          <div className="control-item">
            <div className="key">Space</div>
            <div className="description">瞬間下降</div>
          </div>
          <div className="control-item">
            <div className="key">Shift</div>
            <div className="description">暫存方塊</div>
          </div>
          <div className="control-item">
            <div className="key">ESC</div>
            <div className="description">暫停遊戲</div>
          </div>
        </div>
        <button className="back-button" onClick={onBack}>
          返回主頁
        </button>
      </div>
    </div>
  );
};

export default ControlsPage;
