# ZenTravel — 禪行

> 旅行時不必手忙腳亂找行程。一眼即全貌，回憶優雅生長。

## Quick start

```bash
npm install
npm run dev
```

開啟 http://localhost:5173

## 功能

- **動態時間軸**：自動置頂「即將開始」或「進行中」的行程
- **同卡展開**：點擊卡片優雅展開細節與地圖連結，不開新頁
- **回憶槽**：行程結束後上傳照片＋寫下一句心情，存於 localStorage
- **底部 Tab**：行程 / 回憶兩個視圖切換

## 設計規範

完整禪風設計規範見 [CLAUDE.md](./CLAUDE.md) — 任何後續開發都應遵循。

## 技術棧

- React 18 + Vite 5
- Tailwind CSS 3（自訂 zen tokens）
- Radix UI（Dialog primitive）
- lucide-react（圖示）
- localStorage（回憶持久化）
