import React, { useState } from 'react';
import './AudioSettings.css';
import audioManager from '../utils/audioManager';

const AudioSettings = ({ onClose }) => {
  const [volume, setVolume] = useState(audioManager.getVolume());
  const [isMuted, setIsMuted] = useState(audioManager.getMuted());

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  };

  const testSound = (soundType) => {
    switch (soundType) {
      case 'move':
        audioManager.playSound('move');
        break;
      case 'rotate':
        audioManager.playSound('rotate');
        break;
      case 'lineClear':
        audioManager.playSound('lineClear');
        break;
      case 'levelUp':
        audioManager.playSound('levelUp');
        break;
      default:
        break;
    }
  };

  return (
    <div className="audio-settings-overlay">
      <div className="audio-settings">
        <h2>音頻設置</h2>
        
        <div className="setting-group">
          <label>音量</label>
          <div className="volume-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              disabled={isMuted}
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={isMuted}
              onChange={handleMuteToggle}
            />
            靜音
          </label>
        </div>

        <div className="setting-group">
          <label>測試音效</label>
          <div className="sound-tests">
            <button onClick={() => testSound('move')} disabled={isMuted}>
              移動音效
            </button>
            <button onClick={() => testSound('rotate')} disabled={isMuted}>
              旋轉音效
            </button>
            <button onClick={() => testSound('lineClear')} disabled={isMuted}>
              消除行音效
            </button>
            <button onClick={() => testSound('levelUp')} disabled={isMuted}>
              等級提升音效
            </button>
          </div>
        </div>

        <button className="close-button" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
};

export default AudioSettings;
