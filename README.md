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

## 3. 開發伺服器啟動

本專案為前後端分離設計，需要同時啟動後端 oRPC 服務與前端 Angular 應用程式。

### 3.1 啟動後端 oRPC 伺服器 (Port 3000)
進入 `server` 資料夾，並執行 `npm run dev`（底層已配置為使用 `tsx watch` 啟動，支援 ESM 與熱重載）：

```bash
cd server
npm run dev
```

### 3.2 啟動前台 Storefront 應用 (Port 4200)
於根目錄下，啟動前台的 Angular 開發伺服器：

```bash
npx ng serve storefront
```
啟動後，可於瀏覽器造訪 `http://localhost:4200/`。

### 3.3 啟動後台 Admin Portal 應用
於根目錄下，啟動管理後台的 Angular 開發伺服器：

```bash
npx ng serve admin-portal
```

---

## 4. 專案編譯與建置

### 4.1 建置共享狀態庫
若修改了 `projects/shared-lib/`，需重新建置共享庫以供前台與後台使用：

```bash
npx ng build shared-lib
```

### 4.2 建置前台與後台應用程式
要進行生產環境包的編譯：

```bash
# 建置前台 (包含 SSR 伺服器包編譯與預渲染)
npx ng build storefront

# 建置後台 (純靜態 CSR 資源打包)
npx ng build admin-portal
```

---

## 5. 執行單元測試

本專案使用 **Vitest** 作為單元測試運行器 (Test Runner)。

若要執行全站的單元測試（包含共享庫與前后台應用），請於根目錄執行：

```bash
npx ng test --watch=false
```

---

## 6. 其他資源與文檔

詳細的架構規劃與 API 規格定義，請參考 `docs/` 目錄下的規格書：
*   [電商平台產品需求文檔 (PRD)](file:///home/raybird/Documents/RCodes/angorpc/docs/prd.md)
*   [API 與 oRPC 規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/api/endpoints.md)
*   [前端 UI 與狀態路由規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/ui-and-state-flow.md)
*   [資料庫詳細設計規格書](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/database-design.md)
*   [前後台劃分與未來擴展規劃](file:///home/raybird/Documents/RCodes/angorpc/docs/architecture/storefront-admin-division.md)
