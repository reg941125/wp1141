# 背景音樂資料夾

這個資料夾用來存放遊戲的背景音樂和音效文件。

## 建議的音樂文件

### 背景音樂
- `menu.mp3` - 主選單背景音樂  Disfigure - Blank (Sound Effect)
- `game1.mp3` - level 1 遊戲進行中的背景音樂 Amadeus - Legendary
- `game2.mp3` - level 5 遊戲進行中的背景音樂 [Nightcore] Mortals

### 音效
- `line_clear.mp3` - 消除行音效
- `rotate.mp3` - 方塊旋轉音效
- `move.mp3` - 方塊移動音效
- `drop.mp3` - 方塊下降音效
- `level_up.mp3` - 等級提升音效
- `game_over.mp3` - 遊戲結束音效

## 文件格式建議

- **音頻格式**: MP3 或 OGG
- **音質**: 128kbps 或以上
- **文件大小**: 建議每個文件不超過 2MB
- **時長**: 背景音樂建議 30秒到 2分鐘循環

## 使用方式

1. 將音樂文件放入此資料夾
2. 在遊戲代碼中使用相對路徑引用：
   ```javascript
   const audio = new Audio('/audio/background.mp3');
   ```

## 注意事項

- 確保音樂文件有適當的使用授權
- 避免使用受版權保護的音樂
- 可以考慮使用免版權音樂或自己創作的音樂
- 音效文件建議使用較短的片段以減少加載時間




