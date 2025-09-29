import React from 'react';
import './StartGameDialog.css';

const StartGameDialog = ({ onStart, onBack }) => {
  // 從localStorage獲取當前設定
  const getCurrentSettings = () => {
    const musicVolume = localStorage.getItem('musicVolume') || '100';
    const soundVolume = localStorage.getItem('soundVolume') || '100';
    const dropSpeed = localStorage.getItem('dropSpeed') || 'medium';
    
    return {
      musicVolume: parseInt(musicVolume),
      soundVolume: parseInt(soundVolume),
      dropSpeed: dropSpeed
    };
  };

  const settings = getCurrentSettings();

  const getSpeedText = (speed) => {
    switch (speed) {
      case 'slow': return '慢';
      case 'medium': return '中';
      case 'fast': return '快';
      default: return '中';
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="start-dialog">
        <h2 className="dialog-title">開始遊戲</h2>
        
        <div className="settings-display">
          <h3>當前設定</h3>
          <div className="setting-item">
            <span className="setting-label">音樂音量：</span>
            <span className="setting-value">{settings.musicVolume}%</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">音效音量：</span>
            <span className="setting-value">{settings.soundVolume}%</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">掉落速度：</span>
            <span className="setting-value">{getSpeedText(settings.dropSpeed)}</span>
          </div>
        </div>

        <div className="dialog-buttons">
          <button className="start-button" onClick={onStart}>
            開始遊戲
          </button>
          <button className="back-button" onClick={onBack}>
            返回主頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartGameDialog;



