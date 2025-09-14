# 個人自我介紹網站

這是一個現代化的個人自我介紹網站，採用黑色主題設計，具有響應式布局和互動功能。

## 功能特色

- **響應式設計**: 適配各種設備尺寸
- **平滑滾動導航**: 點擊導航鏈接平滑滾動到對應區塊
- **動畫效果**: 頁面載入和滾動時的動畫效果
- **聯繫表單**: 帶有驗證功能的聯繫表單
- **打字機效果**: 標題的打字機動畫效果

## 文件結構

```
hw1/
├── index.html          # 主要HTML文件
├── styles.css          # CSS樣式文件
├── script.ts           # TypeScript源文件
├── script.js           # 編譯後的JavaScript文件
└── README.md           # 說明文件
```

## 使用方法

1. 直接在瀏覽器中打開 `index.html` 文件
2. 或者使用本地服務器運行（推薦）

### 使用本地服務器

```bash
# 使用Python
python -m http.server 8000

# 使用Node.js
npx serve .

# 使用Live Server (VS Code擴展)
```

然後在瀏覽器中訪問 `http://localhost:8000`

## 自定義內容

### 修改個人信息

在 `index.html` 中修改以下內容：

- 姓名: 修改 `.hero-title` 中的文字
- 職業: 修改 `.hero-subtitle` 中的文字
- 自我介紹: 修改 `.hero-description` 中的段落
- 聯繫方式: 修改 `.contact-info` 中的信息

### 修改技能

在 `index.html` 的 `.skills-grid` 區塊中添加或修改技能標籤。

### 修改經歷

在 `index.html` 的 `.experience` 區塊中添加或修改工作經歷。

## 技術棧

- **HTML5**: 語義化標記
- **CSS3**: 現代CSS特性，包括Grid和Flexbox
- **TypeScript**: 類型安全的JavaScript
- **Font Awesome**: 圖標庫

## 瀏覽器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 自定義樣式

主要顏色變量：
- 背景色: `#000000` (黑色)
- 文字色: `#ffffff` (白色)
- 強調色: `#1e3a8a` (深藍色)
- 次要文字: `#cccccc` (淺灰色)

可以在 `styles.css` 中修改這些顏色來改變網站的主題。
