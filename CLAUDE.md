# ZenTravel — 設計規範總綱

> **使命**：旅行時不必手忙腳亂找行程。一眼即全貌，回憶優雅生長。
> 任何新增的程式、組件、樣式都必須符合本文件的禪風主軸。寧可少做，不要破壞留白。

---

## 一、設計哲學（不可妥協）

1. **視覺減法 > 視覺加法**：每加一個元素前，先問「移除它會更好嗎？」
2. **留白即內容**：間距比顏色更重要，禪意來自呼吸感。
3. **不強調 = 強調**：文字一律 `font-medium`（500），不用 `font-bold`；強調靠對比而非粗細。
4. **動畫只為理解服務**：禁止彈跳、誇張縮放、音效。所有過場 ≤ 400ms、`ease-out`、淡入＋微位移。
5. **資訊分層**：收合卡只顯示「時間 / 地點 / 關鍵備註」三件事。其他細節都在點擊後才出現。

---

## 二、配色 Tokens

寫在 `tailwind.config.js > theme.extend.colors`，永遠用 token 名稱，**不准用任意 hex**。

| Tailwind class                | Hex                     | 用途                              |
| ----------------------------- | ----------------------- | --------------------------------- |
| `bg-cloud-white` / `text-...` | `#F9FAFB`               | 主背景 / 反白文字                  |
| `text-graphite`               | `#1F2937`               | 主文字、標題                      |
| `text-graphite-soft`          | `#4B5563`               | 次要文字、icon、metadata          |
| `text-morandi-blue`           | `#8FA3B5`               | 主強調色（連結、即將開始、focus） |
| `text-sage-green`             | `#A4B5A0`               | 次強調色（進行中、回憶）          |
| `border-divider`              | `#E5E7EB`               | 分隔線、卡片邊框                  |
| `shadow-zen`                  | rgba(31,41,55,0.04)+    | 卡片預設陰影                      |
| `shadow-zen-lg`               | rgba(31,41,55,0.06)     | hover / focus 卡片                |

**透明度搭配**：強調色多用 `/15` `/20` `/30` `/40` 等低不透明度做底色（如 `bg-morandi-blue/15`）。

---

## 三、字體與字級

- 字體堆疊：`Inter` → `"Noto Sans TC"` → 系統 sans
- 字重只用 `font-medium`（500）與預設 `font-normal`（400）
- 字級階：
  - `text-xs` (12) — 標籤、metadata
  - `text-sm` (14) — body 次要、卡內備註
  - `text-base` (16) — body 主要
  - `text-lg` (18) — 卡片標題
  - `text-2xl` (24) — 焦點卡標題
  - `text-3xl` (30) — 頁面 H1
- 數字一律加 `tabular-nums`（避免時間跳動）
- 中英混排：避免顯式字距，靠字體 fallback 自然處理

---

## 四、間距 / 圓角 / 陰影

| 場景       | Class                              |
| ---------- | ---------------------------------- |
| 頁面邊距   | `px-5`（20px）                     |
| 卡片內距   | `p-5`                              |
| 卡片間距   | `space-y-4`                        |
| 區塊間距   | `mt-8`（不同日期區）/ `mb-6`（焦點與時間軸） |
| 卡片圓角   | `rounded-2xl`（16px）              |
| 標籤圓角   | `rounded-full`                     |
| 圖片圓角   | `rounded-xl`                       |
| 卡片陰影   | `shadow-zen` / hover→`shadow-zen-lg` |

**頁面寬度**：所有內容包在 `max-w-md mx-auto` 內，行動裝置優先。

---

## 五、動畫規範

- 卡片展開：`grid-rows-[0fr → 1fr]` + `opacity` + `mt-4`，`duration-300 ease-out`
- 進場：`animate-fade-in-up`（`opacity:0 → 1` + `translate-y-2 → 0`，400ms）
- 切 Tab：靠頁面 `animate-fade-in`（300ms）柔接
- 進行中標：`animate-ping` 的 dot（唯一允許的「持續動畫」）
- **禁止**：`bounce`、`spin`（loading 例外用淡入文字而非 spinner）

---

## 六、組件契約

### `<Card>` (`src/components/ui/card.jsx`)
所有卡片基底。**不要直接寫 `<div class="bg-white rounded-2xl border ...">`，一律用 `<Card>`。**

### `<TimelineCard>` (`src/components/timeline/TimelineCard.jsx`)
單一行程卡。收合時顯示：時間段、標題、地點、關鍵備註。展開時顯示 `details` + Google Maps 連結。

#### 焦點卡 vs 普通卡
- 焦點（`status === 'current' | 'soon'`）：標題用 `text-2xl`、加 `ring-1 ring-morandi-blue/40`
- 普通：標題用 `text-lg`，無 ring
- 過往（`status === 'past'`）：`opacity-60`

### `<TabBar>` (`src/components/layout/TabBar.jsx`)
固定底部，僅兩個 Tab。**新增第三個 Tab 之前先問使用者**，禪風的核心是少。

### `<Dialog>` (`src/components/ui/dialog.jsx`)
僅用於 `MemoryEditor`。其他「需要彈出」的場景應優先考慮：能不能改成同卡展開？

---

## 七、資料模型

### Itinerary Event
資料儲存於 `localStorage['zentravel:itinerary']`。第一次載入時若 key 為空，會用 `sampleItinerary` 種子化（`storage.js > seedIfEmpty`），之後使用者可自由新增 / 編輯 / 刪除。

```js
{
  id: 'evt-001',                            // 唯一鍵（新增時用 newEventId()）
  type: 'sightseeing',                      // 行程類型，見「八、行程類型」
  startTime: '2026-05-05T15:00:00+08:00',   // ISO 8601，固定 +08:00
  endTime:   '2026-05-05T17:00:00+08:00',
  title: '淺草寺',                           // 卡片標題（必填）
  location: '東京都台東區',                   // 副標
  note: '預約碼 ABC-123',                    // 收合卡顯示的關鍵備註（可空字串）
  details: '建議從雷門進入...',               // 展開後的長文
  mapUrl: 'https://www.google.com/maps/...', // 空字串則不顯示按鈕
}
```

**時區規則**：所有時間統一以 `+08:00` 存放（`DEFAULT_TZ_OFFSET`）。表單輸入（`<input type="datetime-local">`）回傳的是 wall-clock，用 `fromInputValue()` / `toInputValue()` 在 `lib/time.js` 轉換。**不要在組件裡自己拼字串**。

**ID 生成**：用 `storage.js > newEventId()`，內部優先用 `crypto.randomUUID()`。

### Memory（localStorage）
```js
// localStorage['zentravel:memories']
{
  'evt-001': {
    photo: 'data:image/jpeg;base64,...',  // 或 null
    caption: '雷門前的人潮意外療癒。',     // 限 80 字
    savedAt: '2026-05-05T17:30:00+08:00'
  }
}
```

### 分群邏輯（`src/lib/time.js > classifyEvent`）
- `current`：`start <= now < end`
- `soon`：`now < start && start - now <= 3 hours`
- `future`：其他未來
- `past`：`end <= now`

「焦點卡」優先序：`current[0] → soon[0] → future[0]`

---

## 八、行程類型（type）

統一定義在 `src/lib/eventTypes.js > EVENT_TYPES`。**所有顯示類型 icon 的地方一律用 `getEventType(id).icon`**，不要在組件內自己 import lucide。

| `id`         | 中文 | Icon (lucide-react) | 慣用色             |
| ------------ | ---- | ------------------- | ------------------ |
| `transit`    | 交通 | `Plane`             | `text-graphite-soft` |
| `food`       | 用餐 | `UtensilsCrossed`   | `text-morandi-blue`  |
| `sightseeing`| 景點 | `Camera`            | `text-sage-green`    |
| `lodging`    | 住宿 | `BedDouble`         | `text-graphite-soft` |
| `shopping`   | 購物 | `ShoppingBag`       | `text-morandi-blue`  |
| `activity`   | 活動 | `Sparkles`          | `text-sage-green`    |
| `other`      | 其他 | `MapPin`            | `text-graphite-soft` |

新增類型時：在 `EVENT_TYPES` 加一筆，icon 從 lucide 挑「線條風格」、不要用實心、不要用色彩飽和度高的圖示。圖示尺寸固定 `h-4 w-4`（卡片）/ `h-3.5 w-3.5`（chip / metadata）。

---

## 九、CRUD 與日期切換

### 新增 / 編輯 / 刪除
- **入口 1**：時間軸頁右上角 `+ 新增` 按鈕（會帶入當前選中日期作為預設）
- **入口 2**：卡片展開後的「編輯」連結
- **元件**：`components/event/EventEditor.jsx`（Dialog form）
- **資料寫入**：透過 `useItinerary().upsertEvent / deleteEvent`，**不要直接呼叫 `storage.js`**，hook 會處理 state 同步
- **刪除確認**：用 `window.confirm`，禪風不需要客製確認 modal

### 日期切換
- **元件**：`components/timeline/DateStrip.jsx`（水平 scroll 的日期 pills）
- **顯示哪些日期**：所有有行程的日期 ∪ 今天 ∪ 今天前後各 1 天（`buildDateKeys`）
- **自動滾動**：選中的 pill 會自動滾到視野中央
- **日期位移計算**：用 `shiftDateKey(key, days)`，**不要用 `toISOString()`**，因為時區會偏一天

### 切換邏輯
- **今天**（`selectedDateKey === todayKey`）：保留焦點卡 + 「現在 14:30」分隔 + 過往折疊
- **其他日期**：純按時間排序，不顯示焦點卡

---

## 十、檔案結構

```
src/
├── components/
│   ├── timeline/   # 行程相關（Timeline、TimelineCard、CurrentTimeBar、DateStrip）
│   ├── memory/     # 回憶相關（Gallery、Card、Editor）
│   ├── event/      # 行程編輯（EventEditor）
│   ├── layout/     # AppShell、TabBar
│   └── ui/         # 基底 primitive（Button、Card、Dialog）— shadcn 風格
├── hooks/          # 純 hooks，無 UI
├── lib/            # 純函式（無 React）— time、storage、utils、eventTypes
├── data/           # sampleItinerary（僅作 seed，正式資料在 localStorage）
├── App.jsx         # Tab state + selectedDateKey + EventEditor 開合
├── main.jsx
└── index.css       # Tailwind + 全域樣式
```

**新增規則**：
- 新組件先看 `ui/` 有沒有可組合的 primitive
- 任何時間相關計算放 `lib/time.js`，不要散落在組件裡
- 任何 localStorage 存取走 `lib/storage.js`

---

## 十一、修改前的 checklist

每次 PR / 新功能前，再確認一次：

- [ ] 用了現有的 token，沒有寫死 hex
- [ ] 沒有 `font-bold`、沒有 `bounce` 動畫
- [ ] 卡片用 `<Card>` 而非自己刻 div
- [ ] 收合狀態只顯示三件事（時間/地點/關鍵備註）
- [ ] 新增的彈窗能不能改成同卡展開？
- [ ] 文案口吻安靜、不催促（不寫「立即」「馬上」「快來」）
- [ ] 行動裝置 375px 寬度排版正確
- [ ] 類型 icon 用 `getEventType(id).icon`，沒有自己 import lucide
- [ ] 時間運算用 `lib/time.js`，沒有自己 `toISOString().slice(0,10)` 算位移
- [ ] CRUD 走 `useItinerary` 的 wrapper，沒有直接呼叫 `storage.js`

---

## 十二、開發指令

```bash
npm install        # 安裝相依
npm run dev        # 開發 server (port 5173)
npm run build      # 建置正式版
npm run preview    # 預覽 build 結果
```

---

> 「最好的介面是讓使用者忘記它存在。」
> — ZenTravel 設計初衷
