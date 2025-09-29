import React, { useState, useEffect, useRef } from 'react';
import './MusicToggle.css';
import audioManager from '../utils/audioManager';

const MusicToggle = () => {
  const [isMuted, setIsMuted] = useState(audioManager.getMuted());
  const [volume, setVolume] = useState(Math.round(audioManager.getVolume() * 100));
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // 從localStorage載入音量設置
    const savedMusicVolume = localStorage.getItem('musicVolume');
    if (savedMusicVolume !== null) {
      const savedVolume = parseInt(savedMusicVolume);
      setVolume(savedVolume);
      audioManager.setVolume(savedVolume / 100);
    }
    setIsMuted(audioManager.getMuted());
  }, []);

  // 點擊外部關閉滑桿
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSlider(false);
      }
    };

    if (showSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlider]);

  const handleVolumeChange = (newVolume) => {
    const volumeValue = parseInt(newVolume);
    setVolume(volumeValue);
    audioManager.setVolume(volumeValue / 100);
    
    // 保存到localStorage
    localStorage.setItem('musicVolume', volumeValue.toString());
    
    // 如果音量設為0，則靜音
    if (volumeValue === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleIconClick = () => {
    // 點擊圖標直接靜音
    audioManager.setVolume(0);
    setVolume(0);
    setIsMuted(true);
    localStorage.setItem('musicVolume', '0');
    setShowSlider(false);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 30) return '🔈';
    if (volume < 70) return '🔉';
    return '🔊';
  };

  return (
    <div 
      ref={containerRef}
      className="music-control-container"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {/* 音量滑桿 */}
      {showSlider && (
        <div className="volume-slider-container">
          <div className="volume-slider">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="volume-input"
            />
            <div className="volume-display">{volume}%</div>
          </div>
        </div>
      )}
      
      {/* 音量圖標 */}
      <button 
        className={`music-toggle ${isMuted ? 'muted' : ''}`}
        onClick={handleIconClick}
        title={isMuted ? '點擊靜音' : '點擊靜音 | 滑鼠懸停調整音量'}
      >
        {getVolumeIcon()}
      </button>
    </div>
  );
};

export default MusicToggle;



