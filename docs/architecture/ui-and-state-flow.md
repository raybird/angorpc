# AngoRPC 電商平台前端 UI 與狀態路由規格書

本文件定義 AngoRPC 電商平台的前端路由結構、組件樹設計，以及基於 Angular Signals 的全域狀態管理與數據流。

本專案採用 **Monorepo 多應用劃分方案**，前台 `storefront` 與後台 `admin-portal` 獨立打包與部署，並透過 `shared-lib` 與後端共享類型協約。

---

## 1. 前台 Storefront 路由與組件設計 (Angular 22 + SSR)

前台專注於 SEO 與載入效能，所有面向終端消費者的路由皆預設開啟 **SSR (伺服器端渲染)** 與漸進式水合 (Client Hydration)。

### 1.1 前台路由表 (Storefront Routes)
所有路由使用 `MainLayoutComponent` 佈局組件包覆。

| 網址路徑 (Path) | 對應頁面組件 | 渲染模式 | 說明 |
| :--- | :--- | :--- | :--- |
| `/` | `HomeComponent` | SSR + Dynamic | 首頁，展示精選商品與分類入口 |
| `/products` | `ProductListComponent` | SSR + Dynamic | 商品列表頁，支援分類篩選與關鍵字搜尋 |
| `/products/:slug` | `ProductDetailComponent` | SSR + Dynamic | 商品詳情頁，展示詳細介紹與加入購物車 |
| `/cart` | `CartComponent` | CSR Only | 購物車清單與數量編輯頁（不需 SEO） |
| `/checkout` | `CheckoutComponent` | CSR Only (Guard) | 結帳與填寫收件資訊頁，受 `AuthGuard` 保護 |
| `/orders/:id` | `OrderDetailComponent` | CSR Only (Guard) | 訂單追蹤與明細頁，受 `AuthGuard` 保護 |
| `/user/profile` | `UserProfileComponent` | CSR Only (Guard) | 會員個人資料管理頁，受 `AuthGuard` 保護 |
| `/login` | `LoginComponent` | CSR Only | 用戶登入頁 |
| `/register` | `RegisterComponent` | CSR Only | 用戶註冊頁 |

### 1.2 前台組件關係結構
```
MainLayoutComponent
├── HeaderComponent (含搜尋列、購物車摘要及會員狀態)
├── RouterOutlet (渲染各子頁面組件)
│   ├── HomeComponent (展示 ProductCardComponent 列表)
│   ├── ProductDetailComponent (購買數量選擇器、評論系統)
│   └── CartComponent (購物車明細清單、結帳按鈕)
└── FooterComponent (網站宣傳、多語言/多幣種切換器)
```

---

## 2. 後台 Admin Console 路由與組件設計 (Angular 22 - 純 CSR)

後台專注於豐富的互動性與安全權限控管，完全採用 **CSR (純客戶端渲染 SPA)**，並直接編譯為靜態資源部署至物件儲存。

### 2.1 後台路由表 (Admin Portal Routes)
所有管理功能路由使用 `AdminLayoutComponent` 佈局組件包覆，並全面受 `AdminGuard` 守衛保護。

| 網址路徑 (Path) | 對應頁面組件 | 守衛防護 | 說明 |
| :--- | :--- | :--- | :--- |
| `/admin/login` | `AdminLoginComponent` | 無 | 管理員專用登入頁 |
| `/admin/dashboard` | `DashboardComponent` | `AdminGuard` | 後台首頁，呈現銷售趨勢、熱銷排行等圖表 |
| `/admin/products` | `AdminProductListComponent` | `AdminGuard` | 商品列表與批量上下架管理 |
| `/admin/products/new` | `ProductFormComponent` | `AdminGuard` | 新增商品表單 |
| `/admin/products/:id/edit` | `ProductFormComponent` | `AdminGuard` | 編輯商品表單 |
| `/admin/orders` | `AdminOrderListComponent` | `AdminGuard` | 全站訂單清單，支援狀態更新與發貨處理 |
| `/admin/orders/:id` | `AdminOrderDetailComponent` | `AdminGuard` | 訂單詳細資訊與退款處理面版 |
| `/admin/users` | `AdminUserListComponent` | `AdminGuard` | 全站會員清單與權限角色調整 |

---

## 3. Angular Signals 核心狀態管理

為確保高效能與細粒度更新，本平台使用 Angular Signals 替代 RxJS 作為主要的狀態管理方案。

```
                       ┌─────────────────────────┐
                       │  oRPC API (Backend)     │
                       └────────────▲────────────┘
                                    │ oRPC 呼叫
                       ┌────────────┴────────────┐
                       │  Signals State Services │
                       │  (CartState / AuthState)│
                       └────────────┬────────────┘
         ┌──────────────────────────┼──────────────────────────┐
         │ 訂閱狀態/變更               │ 訂閱狀態/變更               │ 訂閱狀態/變更
┌────────▼────────┐        ┌────────▼────────┐        ┌────────▼────────┐
│ HeaderComponent │        │  CartComponent  │        │ CheckoutPage    │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### 3.1 認證狀態 (`AuthStateService`)
全域追蹤與控管登入狀態、Token 以及角色權限：

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  // 核心 Signals
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem('token'));
  
  // 計算 Signals (Computed)
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  
  constructor(private orpcClient: OrpcClient) {}

  async login(credentials: LoginCredentials) {
    const res = await this.orpcClient.user.login(credentials);
    this.token.set(res.token);
    this.currentUser.set(res.user);
    localStorage.setItem('token', res.token);
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
  }
}
```

### 3.2 購物車狀態 (`CartStateService`)
管理商品加入購物車、修改數量、計算總價與清除：

```typescript
@Injectable({ providedIn: 'root' })
export class CartStateService {
  private orpcClient = inject(OrpcClient);
  
  // 核心 Signal
  readonly cartItems = signal<CartItem[]>([]);
  
  // 計算 Signals (Computed)
  readonly cartCount = computed(() => 
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  readonly totalPrice = computed(() => 
    this.cartItems().reduce((total, item) => total + (item.price * item.quantity), 0)
  );

  async fetchCart() {
    const res = await this.orpcClient.cart.getCart();
    this.cartItems.set(res.items);
  }

  async addItem(productId: string, quantity: number) {
    const res = await this.orpcClient.cart.addItem({ productId, quantity });
    this.cartItems.set(res.items);
  }

  async updateQuantity(productId: string, quantity: number) {
    const res = await this.orpcClient.cart.updateItem({ productId, quantity });
    this.cartItems.set(res.items);
  }

  async removeItem(productId: string) {
    const res = await this.orpcClient.cart.removeItem({ productId });
    this.cartItems.set(res.items);
  }
}
```

---

## 4. 共享元件庫 (`shared-lib`) 設計

為了避免重複程式碼並維持前台與後台的視覺一致性，通用元件封裝於 `projects/shared-lib`。

### 4.1 核心共享元件清單
1. **ButtonComponent (按鈕)**：
   * **Inputs**：
     * `variant: 'primary' | 'secondary' | 'outline' | 'danger'`
     * `size: 'sm' | 'md' | 'lg'`
     * `disabled: boolean`
     * `loading: boolean`
   * **Outputs**：`click: EventEmitter<MouseEvent>`
2. **ProductCardComponent (商品卡片)**：
   * **Inputs**：`product: Product` (核心商品實體)
   * **Outputs**：
     * `addToCart: EventEmitter<string>` (發出商品 ID)
     * `cardClick: EventEmitter<string>` (跳轉詳情)
3. **DialogComponent (通用對話框)**：
   * **Inputs**：
     * `title: string`
     * `isOpen: boolean`
     * `size: 'sm' | 'md' | 'lg'`
   * **Outputs**：`close: EventEmitter<void>`
4. **ToastComponent (通知提示)**：
   * 透過全域 `ToastService` 動態觸顯示。
   * 支援 `success`, `error`, `warning`, `info` 四種狀態。

---
*文件建立日期：2026年06月18日*
*負責人：Antigravity*
