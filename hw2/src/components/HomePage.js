import React, { useEffect } from 'react';
import './HomePage.css';
import audioManager from '../utils/audioManager';

const HomePage = ({ onStart, onControls, onSettings }) => {
  useEffect(() => {
    // 只在沒有播放選單音樂時才播放
    if (!audioManager.isPlayingMenuMusic()) {
      audioManager.playBackgroundMusic('menu');
    }
    
    // 清理函數：只有在切換到遊戲頁面時才停止音樂
    return () => {
      // 不在此處停止音樂，讓音樂持續播放
    };
  }, []);

  return (
    <div className="home-page">
      <div className="game-background"></div>
      <div className="home-content">
        <h1 className="game-title">方塊堆疊遊戲</h1>
        <div className="button-container">
          <button className="game-button start-button" onClick={onStart}>
            START
          </button>
          <button className="game-button controls-button" onClick={onControls}>
            按鍵介紹
          </button>
          <button className="game-button settings-button" onClick={onSettings}>
            設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
