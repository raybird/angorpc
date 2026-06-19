# AngoRPC 電商平台 (AngoRPC Workspace)

本專案是一個基於 **Angular 22 + SSR + [oRPC](https://github.com/middleapi/orpc)** 的現代化電商平台。專案採用 Monorepo 多應用劃分架構，透過與後端共享 Zod Schema，實現了極致的「端到端類型安全 (End-to-End Type Safety)」。

*最後更新日期：2026年06月19日*

---

## 1. 專案目錄結構

本 Workspace 包含以下主要應用程式與套件：

```
angorpc/ (Workspace 根目錄)
├── projects/
│   ├── storefront/            # 前台消費者端應用 (Angular 22 + SSR)
│   ├── admin-portal/          # 後台商家管理系統 (Angular 22 - 純 CSR)
│   └── shared-lib/            # 共享庫 (前端 UI、oRPC Client 服務、Auth/Cart 全域狀態)
├── server/                    # 統一的 Express + oRPC 後端伺服器 (Node.js)
└── shared/                    # 前後端共享的 Zod Schemas 與 TypeScript 類型定義
```

---

## 2. 開發環境準備

本專案推薦使用 **Node.js v22.22.3**。

在開始開發前，請先於根目錄及後端目錄安裝相關依賴套件：

```bash
# 安裝 Workspace 根目錄套件
npm install

# 安裝後端服務套件
cd server
npm install
cd ..
```

---

## 3. Docker Compose 快速啟動

若要一次啟動資料庫、Redis、後端、前台與後台，可於專案根目錄執行：

```bash
docker compose up --build
```

啟動完成後可造訪以下服務：

| 服務 | URL | 說明 |
| --- | --- | --- |
| Storefront 前台 | `http://localhost:4200/` | 消費者端購物頁面 |
| Admin Portal 後台 | `http://localhost:4201/` | 商家管理後台 |
| Backend oRPC API | `http://localhost:3000/api/rpc` | 後端 API 入口 |
| PostgreSQL | `localhost:5432` | 開發資料庫 |
| Redis | `localhost:6379` | 快取服務 |

Docker 啟動時會執行 Prisma `db push` 與 seed，建立預設測試資料與後台管理員帳號。

後台測試帳號：

| 欄位 | 值 |
| --- | --- |
| Email | `admin@angorpc.com` |
| Password | `admin123` |

若要在背景執行服務，可使用：

```bash
docker compose up -d --build
```

若要查看服務狀態或停止服務：

```bash
docker compose ps
docker compose down
```

---

## 4. 開發伺服器啟動

本專案為前後端分離設計，需要同時啟動後端 oRPC 服務與前端 Angular 應用程式。

### 4.1 啟動後端 oRPC 伺服器 (Port 3000)
進入 `server` 資料夾，並執行 `npm run dev`（底層已配置為使用 `tsx watch` 啟動，支援 ESM 與熱重載）：

```bash
cd server
npm run dev
```

### 4.2 啟動前台 Storefront 應用 (Port 4200)
於根目錄下，啟動前台的 Angular 開發伺服器：

```bash
npx ng serve storefront
```
啟動後，可於瀏覽器造訪 `http://localhost:4200/`。

### 4.3 啟動後台 Admin Portal 應用
於根目錄下，啟動管理後台的 Angular 開發伺服器：

```bash
npx ng serve admin-portal
```

---

## 5. 專案編譯與建置

### 5.1 建置共享狀態庫
若修改了 `projects/shared-lib/`，需重新建置共享庫以供前台與後台使用：

```bash
npx ng build shared-lib
```

### 5.2 建置前台與後台應用程式
要進行生產環境包的編譯：

```bash
# 建置前台 (包含 SSR 伺服器包編譯與預渲染)
npx ng build storefront

# 建置後台 (純靜態 CSR 資源打包)
npx ng build admin-portal
```

---

## 6. 執行單元測試

本專案使用 **Vitest** 作為單元測試運行器 (Test Runner)。

若要執行全站的單元測試（包含共享庫與前后台應用），請於根目錄執行：

```bash
npx ng test --watch=false
```

---

## 7. 其他資源與文檔

詳細的架構規劃與 API 規格定義，請參考 `docs/` 目錄下的規格書：
*   [電商平台產品需求文檔 (PRD)](file:///home/raybird/Documents/RCodes/angorpc/docs/prd.md)
*   [API 與 oRPC 規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/api/endpoints.md)
*   [前端 UI 與狀態路由規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/ui-and-state-flow.md)
*   [資料庫詳細設計規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/database-design.md)
*   [前後台劃分與未來擴展規劃](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/storefront-admin-division.md)

---

## 8. 專案開發狀態與進度 (Development Status & Roadmap)

目前專案的各模組實作現況如下：

### 8.1 前台 Storefront (消費者端)
*   **首頁與商品目錄**：支援響應式 UI、分類篩選與動態關鍵字搜尋。
*   **商品詳細頁 (`/products/:slug`)**：雙欄玻璃擬態設計，支援骨架屏 (Skeleton Screen) 載入動畫、動態數量加減與庫存警示。
*   **購物車管理與結帳導航**：以 Angular Signals 全域管理購物車狀態，支援數量加減與流暢的結帳填寫與確認導航。
*   **優惠券與折扣系統 (Coupon & Discount)**：已於 2026年06月19日 實作完畢。支援輸入折扣碼、動態計算折扣金額，並與下單流程深度聯動。
*   **SSR 路由優化**：動態路由透過配置 `RenderMode.Server` 於伺服器端渲染 (SSR) 執行，兼顧動態內容與 SEO。
*   **單元測試**：累積 26 個單元測試（包含元件與 state 服務）已全數成功通過。

### 8.2 後端 Express + oRPC
*   **API 服務**：透過 oRPC 實現極致的端到端類型安全 (End-to-End Type Safety)，與前端共享 Zod v4 Schemas 驗證。
*   **資料庫事務與併發控制**：下單流程（建立訂單、扣減庫存、清除購物車）使用 Prisma `$transaction` 保障原子性；扣庫存採用樂觀鎖自增 `version` 機制防範超賣，並於 2026年06月19日 完成測試修復。
*   **管理員 API 防護**：實作 `authMiddleware` 強制校驗管理員身份，為後台商品新增與編輯操作提供安全保障。

### 8.3 管理後台 Admin Portal (商家端)
*   **基礎建設與登入防範**：採用 JWT 驗證與 Angular Guard，確保非管理員無法造訪後台，並提供基本的儀表板 Layout。
*   **商品管理 (Product Management)**：支援分頁列表、模糊搜尋、分類篩選、上架與下架狀態即時切換。
*   **商品新增/編輯表單**：採用 Glassmorphism 設計，支援名稱自動 Slug 生成、欄位前端與後端 Zod 校驗。

### 8.4 開發中與下一步規劃
*   **後台優惠券管理 (Coupon Management)**：提供優惠券建立、編輯與使用狀態統計。
*   **後台訂單管理 (Order Management)**：提供訂單列表、狀態變更（發貨、退款）與統計報表。
