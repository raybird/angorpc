# AngoRPC 用戶認證與會員系統實作 - 成果總結

我們已順利為 AngoRPC 電商平台實作完成了完整的「用戶認證與會員註冊登入系統 (JWT + Zod 驗證)」，涵蓋後端密碼雜湊、JWT 驗證中間件、前端全域 Signals 狀態服務，以及 Storefront 的登入與註冊頁面。

---

## 實作變更與架構配置

### 1. 後端依賴與密碼加密安全
* 於 `server/` 安裝 `bcrypt` 與 `jsonwebtoken` 及其 TS 聲明庫。
* 實作 `server/src/db.ts` 作為 **PrismaClient 單例 (Singleton)**，供所有服務共用，優化連線池。
* 在 `server/src/user.ts` 中，註冊帳號時密碼皆透過 `bcrypt.hash` 進行 10 輪鹽值雜湊處理，確保資料庫儲存安全。

### 2. JWT 驗證中間件與 Context 傳遞
* **Express 轉接層**：更新 `server/src/server.ts`，在呼叫 oRPC `fetchHandler` 時將 `req.headers.authorization` 傳入 oRPC Context。
* **`authMiddleware`**：建立 `server/src/middleware/auth.ts` 驗證 `Bearer` JWT 令牌，解析成功後自動將 `userId` 與 `role` 載入 Context，並掛載於 `getProfile` 端點。

### 3. 前端全域認證狀態服務 (`AuthStateService`)
* 於 `shared-lib/src/lib/auth-state.ts` 建立 `AuthStateService`：
  * 使用 Angular Signals 全域追蹤 `currentUser` 與 `token`。
  * 提供 `isAuthenticated` 與 `isAdmin` 作為 `computed` 唯讀訊號。
  * **SSR 相容防護**：利用 `isPlatformBrowser` 包覆 `localStorage` 的讀寫，確保頁面在伺服器端渲染 (SSR) 期間不崩潰。
  * **自動恢復會話**：應用程式初始化時若本地有 token，會自動發送 `getProfile` 請求恢復會員狀態。

### 4. 登入與註冊頁面 UI
* 於 `projects/storefront/src/app/login/` 及 `projects/storefront/src/app/register/` 建立精美的登入/註冊頁面。
* **技術特點**：
  * 使用 Angular `ReactiveFormsModule` 進行響應式表單欄位驗證（如 Email 格式、密碼長度）。
  * 導入 **Premium 深色極光設計風格 (Dark Mode Aurora Glow)** 與玻璃擬態卡片，提升整體視覺感受。
  * 支援註冊後/登入後自動透過 Router 導航返回首頁。

---

## 驗證結果

* **後端編譯驗證**：在 `server/` 下執行 `npm run build`，後端 TypeScript 完全無編譯錯誤。
* **前端編譯驗證**：
  * 執行 `npx ng build shared-lib` 順利產出。
  * 執行 `npx ng build storefront` 成功產生 Browser & Server (SSR) bundles。

---
*文檔更新日期：2026年06月18日*
*負責人：Antigravity*
