# AI 面試系統

對話式 AI 面試平台，使用 Groq AI 提供專業的面試體驗。

## 功能特色

- 對話式面試介面
- 即時 AI 回應
- 現代化 UI 設計
- 全螢幕布局
- 響應式設計

## 技術棧

- Next.js 14
- React 18
- TypeScript
- Groq AI SDK
- CSS Modules

## 安裝步驟

1. 安裝依賴套件：

```bash
npm install
```

2. 設定環境變數：

建立 `.env.local` 檔案並加入以下內容：

```
GROQ_API_KEY=your_groq_api_key_here
```

3. 啟動開發伺服器：

```bash
npm run dev
```

4. 開啟瀏覽器訪問：

```
http://localhost:3000
```

## 取得 Groq API Key

1. 前往 [Groq Console](https://console.groq.com/)
2. 註冊或登入帳號
3. 建立新的 API Key
4. 將 API Key 複製到 `.env.local` 檔案中

## 專案結構

```
interview/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Groq AI API 路由
│   ├── globals.css                # 全域樣式
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 主頁面
│   └── page.module.css            # 主頁面樣式
├── components/
│   ├── ChatInterface.tsx          # 對話介面組件
│   └── ChatInterface.module.css   # 對話介面樣式
├── package.json
├── tsconfig.json
└── README.md
```

## 使用說明

1. 點擊「開始面試」按鈕
2. AI 面試官會先詢問您的背景
3. 輸入您的回答並按 Enter 或點擊發送
4. 繼續與 AI 面試官進行對話

## 開發指令

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 建置生產版本
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行 ESLint 檢查
