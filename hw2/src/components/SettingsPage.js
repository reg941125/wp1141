import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import audioManager from '../utils/audioManager';

const SettingsPage = ({ onBack }) => {
  const [musicVolume, setMusicVolume] = useState(100);
  const [soundVolume, setSoundVolume] = useState(100);
  const [dropSpeed, setDropSpeed] = useState('medium');

  // 載入設定
  useEffect(() => {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSoundVolume = localStorage.getItem('soundVolume');
    const savedDropSpeed = localStorage.getItem('dropSpeed');

    if (savedMusicVolume !== null) {
      setMusicVolume(parseInt(savedMusicVolume));
    }
    if (savedSoundVolume !== null) {
      setSoundVolume(parseInt(savedSoundVolume));
    }
    if (savedDropSpeed !== null) {
      setDropSpeed(savedDropSpeed);
    }

    // 應用設定到音頻管理器
    audioManager.setVolume(musicVolume / 100);
    audioManager.setSoundVolume(soundVolume / 100);
  }, [musicVolume, soundVolume]);

  // 音樂音量變更
  const handleMusicVolumeChange = (e) => {
    const volume = parseInt(e.target.value);
    setMusicVolume(volume);
    audioManager.setVolume(volume / 100);
    localStorage.setItem('musicVolume', volume);
  };

  // 音效音量變更
  const handleSoundVolumeChange = (e) => {
    const volume = parseInt(e.target.value);
    setSoundVolume(volume);
    audioManager.setSoundVolume(volume / 100);
    localStorage.setItem('soundVolume', volume);
  };

  // 掉落速度變更
  const handleDropSpeedChange = (e) => {
    const speed = e.target.value;
    setDropSpeed(speed);
    localStorage.setItem('dropSpeed', speed);
  };

  return (
    <div className="settings-page">
      <div className="game-background"></div>
      <div className="settings-content">
        <h1 className="settings-title">遊戲設定</h1>
        
        <div className="settings-section">
          <h2>音頻設定</h2>
          
          <div className="setting-item">
            <label htmlFor="music-volume">音樂音量</label>
            <div className="volume-control">
              <input
                type="range"
                id="music-volume"
                min="0"
                max="100"
                value={musicVolume}
                onChange={handleMusicVolumeChange}
                className="volume-slider"
              />
              <span className="volume-value">{musicVolume}%</span>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="sound-volume">音效音量</label>
            <div className="volume-control">
              <input
                type="range"
                id="sound-volume"
                min="0"
                max="100"
                value={soundVolume}
                onChange={handleSoundVolumeChange}
                className="volume-slider"
              />
              <span className="volume-value">{soundVolume}%</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>遊戲設定</h2>
          
          <div className="setting-item">
            <label htmlFor="drop-speed">方塊掉落速度</label>
            <select
              id="drop-speed"
              value={dropSpeed}
              onChange={handleDropSpeedChange}
              className="speed-select"
            >
              <option value="slow">慢</option>
              <option value="medium">中</option>
              <option value="fast">快</option>
            </select>
          </div>
        </div>

        <button className="back-button" onClick={onBack}>
          返回主頁
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;


