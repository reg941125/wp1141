// 音效管理器
class AudioManager {
  constructor() {
    this.audioFiles = {
      menu: '/audio/menu.mp3',
      game1: '/audio/game1.mp3',
      game2: '/audio/game2.mp3',
      lineClear: '/audio/line_clear.mp3',
      rotate: '/audio/rotate.mp3',
      move: '/audio/move.mp3',
      drop: '/audio/drop.mp3',
      levelUp: '/audio/level_up.mp3',
      gameOver: '/audio/game_over.mp3'
    };
    
    this.audioInstances = {};
    this.isMuted = false;
    this.volume = 1.0; // 音樂音量 (0-1)
    this.soundVolume = 1.0; // 音效音量 (0-1)
    this.currentBackgroundMusic = null;
    this.lastPlayedMusic = null;
    
    this.initializeAudio();
  }
  
  // 初始化音頻實例
  initializeAudio() {
    Object.keys(this.audioFiles).forEach(key => {
      try {
        const audio = new Audio(this.audioFiles[key]);
        audio.volume = this.volume;
        audio.preload = 'auto';
        this.audioInstances[key] = audio;
      } catch (error) {
        console.warn(`無法加載音頻文件: ${this.audioFiles[key]}`, error);
      }
    });
  }
  
  // 播放音效
  playSound(soundKey) {
    if (this.isMuted || this.soundVolume === 0) return;
    
    const audio = this.audioInstances[soundKey];
    if (audio) {
      try {
        audio.currentTime = 0; // 重設到開始
        audio.play().catch(error => {
          console.warn(`播放音效失敗: ${soundKey}`, error);
        });
      } catch (error) {
        console.warn(`播放音效時發生錯誤: ${soundKey}`, error);
      }
    }
  }
  
  // 設置音樂音量 (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateAudioVolumes();
  }

  // 設置音效音量 (0-1)
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this.updateAudioVolumes();
  }

  // 更新所有音頻實例的音量
  updateAudioVolumes() {
    Object.keys(this.audioInstances).forEach(key => {
      const audio = this.audioInstances[key];
      if (audio) {
        const isBackground = ['menu', 'game1', 'game2'].includes(key);
        if (isBackground) {
          audio.volume = this.volume * 0.7 * (this.isMuted ? 0 : 1);
        } else {
          audio.volume = this.soundVolume * (this.isMuted ? 0 : 1);
        }
      }
    });
  }

  // 播放背景音樂
  playBackgroundMusic(musicKey, loop = true) {
    if (this.isMuted || this.volume === 0) return;
    
    // 如果正在播放相同的音樂，不要重新開始
    if (this.currentBackgroundMusic === musicKey) {
      const audio = this.audioInstances[musicKey];
      if (audio && !audio.paused) {
        return; // 音樂正在播放，不需要重新開始
      }
    }
    
    // 停止其他背景音樂
    Object.keys(this.audioInstances).forEach(key => {
      if (['menu', 'game1', 'game2'].includes(key) && key !== musicKey) {
        const audio = this.audioInstances[key];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
    
    const audio = this.audioInstances[musicKey];
    if (audio) {
      try {
        audio.loop = loop;
        audio.volume = this.volume * 0.7; // 背景音樂音量稍低
        this.currentBackgroundMusic = musicKey;
        this.lastPlayedMusic = musicKey;
        audio.play().catch(error => {
          console.warn(`播放背景音樂失敗: ${musicKey}`, error);
        });
      } catch (error) {
        console.warn(`播放背景音樂時發生錯誤: ${musicKey}`, error);
      }
    }
  }
  
  // 停止背景音樂
  stopBackgroundMusic() {
    ['menu', 'game1', 'game2'].forEach(key => {
      const audio = this.audioInstances[key];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    this.currentBackgroundMusic = null;
    // 注意：不清除 lastPlayedMusic，以便取消靜音時能恢復
  }
  
  // 完全停止音樂（用於遊戲結束時）
  stopAllMusic() {
    this.stopBackgroundMusic();
    this.lastPlayedMusic = null;
  }
  
  
  // 靜音/取消靜音（現在基於音量控制）
  toggleMute() {
    if (this.volume > 0 && this.soundVolume > 0) {
      // 如果音量不為0，則靜音（設為0）
      this.isMuted = true;
      this.updateAudioVolumes();
    } else {
      // 如果音量為0，則恢復音量
      this.isMuted = false;
      // 從localStorage恢復音量設置
      const savedMusicVolume = localStorage.getItem('musicVolume');
      const savedSoundVolume = localStorage.getItem('soundVolume');
      
      if (savedMusicVolume !== null) {
        this.volume = parseInt(savedMusicVolume) / 100;
      } else {
        this.volume = 1.0;
      }
      
      if (savedSoundVolume !== null) {
        this.soundVolume = parseInt(savedSoundVolume) / 100;
      } else {
        this.soundVolume = 1.0;
      }
      
      this.updateAudioVolumes();
      
      // 恢復播放上次播放的音樂
      if (this.lastPlayedMusic && this.volume > 0) {
        this.playBackgroundMusic(this.lastPlayedMusic);
      }
    }
    
    return this.isMuted;
  }
  
  // 設置靜音狀態
  setMuted(muted) {
    this.isMuted = muted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      // 取消靜音時，恢復播放之前的音樂
      if (this.lastPlayedMusic) {
        this.playBackgroundMusic(this.lastPlayedMusic);
      }
    }
  }
  
  // 獲取靜音狀態
  getMuted() {
    return this.isMuted;
  }
  
  // 獲取音量
  getVolume() {
    return this.volume;
  }
  
  // 檢查是否正在播放選單音樂
  isPlayingMenuMusic() {
    return this.currentBackgroundMusic === 'menu';
  }
  
  // 獲取當前播放的背景音樂
  getCurrentBackgroundMusic() {
    return this.currentBackgroundMusic;
  }
}

// 創建全局音效管理器實例
const audioManager = new AudioManager();

export default audioManager;
