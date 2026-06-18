# Angular 22 新特性與優勢

## Angular 22 主要更新

### 1. 全面無 Zone 運作 (Zoneless Angular)

Angular 22 將無 Zone.js 運作（Zoneless）提升為首選架構，顯著提升應用程式效能：

#### 傳統架構 (Zone.js)
傳統的 Angular 依賴 Zone.js 監聽所有非同步事件（如點擊、定時器、XHR），並在事件發生後對整個組件樹進行變更偵測。這在大型應用中會導致不必要的效能開銷。

#### Zoneless 架構 (推薦)
透過 `provideZonelessChangeDetection()`，Angular 22 不再依賴 Zone.js，而是完全基於 Angular Signals 的依賴關係追蹤，僅在狀態真正改變的組件上觸發更新。

#### 優勢
- **效能極致提升**: 減少不必要的變更偵測週期，降低 CPU 使用率。
- **打包體積更小**: 移除 Zone.js 依賴，減少約 30KB 的 Bundle 大小。
- **更好的除錯體驗**: 呼叫堆疊（Call Stack）更加清晰，不再被 Zone.js 的封裝污染。
- **微前端整合更簡單**: 在多個前端框架共存的環境中，不會再有 Zone.js 的全域衝突。

### 2. 全信號 API (Signal-based APIs)

Angular 22 全面穩定並推廣以 Signals 為基礎的組件 API，用以取代舊有的裝飾器：

#### 舊裝飾器語法 (已棄用)
```typescript
@Input() userId!: string;
@Output() userCreated = new EventEmitter<User>();
@ViewChild('myInput') myInput!: ElementRef;
```

#### 新 Signal 語法 (推薦)
```typescript
// Signal Inputs
userId = input.required<string>();

// Signal Outputs (自動基於 RxJS 且不依賴 EventEmitter)
userCreated = output<User>();

// Signal Queries
myInput = viewChild<ElementRef>('myInput');

// Model Inputs (雙向綁定 Signal)
quantity = model(1);
```

#### 優勢
- **類型安全**: 全面支援唯讀 Signal 類型，編譯器能精確捕捉錯誤。
- **響應式依賴**: 可直接配合 `computed()` 和 `effect()` 使用，不需要複雜的 lifecycle hooks。

### 3. 全新非同步資料加載 (Resource API)

Angular 22 引入了 `resource()` 與 `rxResource()` API，專為非同步 API 請求設計，能與 Signals 完美整合。

```typescript
import { resource } from '@angular/core';

// 定義 Resource 載入 API 資料
userData = resource({
  request: () => ({ id: this.userId() }),
  loader: async ({ request }) => {
    const res = await fetch(`/api/user/${request.id}`);
    return res.json() as Promise<User>;
  }
});
```

#### 優勢
- **內建狀態追蹤**: 自動提供 `.value()`、`.status()`、`.isLoading()` 等 Signals。
- **自動重新加載**: 當 `request` 中依賴的 Signal（如 `userId()`）改變時，自動觸發重新加載。

### 4. 進階 SSR 與漸進式水合 (Incremental Hydration)

Angular 22 對 `@angular/ssr` 進行了重大優化：
- **漸進式水合 (Incremental Hydration)**：允許開發者僅水合用戶可見或已互動的組件區域（比如使用 `@defer(hydrate on interaction)`），極大縮短 Time to Interactive (TTI)。
- **事件重放 (Event Replay)**：在水合完成前，用戶在頁面上的點擊與輸入事件會被自動捕獲並在水合後重新執行，確保用戶體驗無縫。

---

## 在 AngoRPC 專案中的應用

### 1. 服務端初始化設定

在 `app.config.ts` 中，我們將全面啟用 Zoneless 變更偵測：

```typescript
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay())
  ]
};
```

### 2. 共享狀態與服務端渲染優化

結合 oRPC 進行類型安全的非同步資料獲取：

```typescript
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    @if (userResource.isLoading()) {
      <div>載入中...</div>
    } @else if (userResource.error()) {
      <div>載入失敗</div>
    } @else if (userResource.value(); as user) {
      <div class="user-profile">
        <h1>{{ user.name }}</h1>
        <p>{{ user.email }}</p>
      </div>
    }
  `
})
export class UserDetailComponent {
  private userService = inject(UserService);
  
  // Signal Input
  userId = input.required<string>();

  // 使用 rxResource 整合 oRPC 客戶端請求
  userResource = rxResource({
    request: () => ({ id: this.userId() }),
    loader: ({ request }) => this.userService.getUserById(request.id)
  });
}
```

---

## 遷移與開發建議

### 1. 建置與 CLI 工具
在初始化專案時，直接使用 Angular CLI 22 進行全新建置：
```bash
# 初始化 Angular 22 專案並預設啟用 SSR
npx -y @angular/cli@22 new angorpc --ssr
```

### 2. 避免使用傳統裝飾器與 Zone.js 依賴
- 嚴禁使用 `@Input`, `@Output`, `@ViewChild`。
- 專案程式碼中不使用 `NgZone`，全面改用 Signals 與 `effect()` 處理變更。

### 3. 注意事項
- **第三方庫相容性**：確認引入的第三方 UI 組件庫（如 PrimeNG / Angular Material）支援無 Zone.js (Zoneless) 模式。
- **服務端路徑**：在 SSR 與非 SSR 模式下使用絕對/相對路徑的切換需經由 `isPlatformBrowser` 判定。

---

最後更新：2026年06-18
