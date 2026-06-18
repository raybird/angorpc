# 電商平台技術架構設計

## 文檔資訊
- **專案名稱**: AngoRPC 電商平台
- **版本**: v1.0
- **建立日期**: 2025年10月26日
- **最後更新**: 2025年10月26日
- **負責人**: BMad Master

## 1. 架構概述

### 1.1 整體架構
本電商平台採用前後端分離的架構，使用 Angular 22 + SSR 作為前端，Node.js + [oRPC](https://github.com/middleapi/orpc) 作為後端，實現類型安全的端到端通信。

### 1.2 技術選型理由
- **Angular 22**: 企業級穩定性，內建 SSR 支援
- **[oRPC](https://github.com/middleapi/orpc)**: 類型安全的 RPC 通信，自動生成客戶端代碼
- **PostgreSQL**: 成熟的關聯式資料庫，支援複雜查詢
- **Prisma**: 現代化的 ORM，提供類型安全的資料庫操作

## 2. 系統架構圖

```mermaid
graph TB
    subgraph "客戶端層"
        A[瀏覽器] --> B[Angular App]
        B --> C[Angular Universal SSR]
        C --> D[ORPC Client]
    end
    
    subgraph "API 閘道層"
        E[Nginx] --> F[負載平衡器]
    end
    
    subgraph "應用服務層"
        G[Node.js Server] --> H[ORPC Server]
        H --> I[業務邏輯層]
        I --> J[資料存取層]
    end
    
    subgraph "資料層"
        K[PostgreSQL] --> L[Redis 快取]
        M[檔案儲存] --> N[CDN]
    end
    
    subgraph "外部服務"
        O[支付閘道]
        P[物流 API]
        Q[郵件服務]
    end
    
    D -.->|RPC Calls| H
    E --> G
    J --> K
    I --> O
    I --> P
    I --> Q
```

## 3. 前端架構設計

### 3.1 Angular 22 應用結構
```
src/
├── app/
│   ├── core/                    # 核心模組
│   │   ├── auth/               # 認證服務
│   │   ├── api/                # API 服務
│   │   ├── interceptors/       # HTTP 攔截器
│   │   └── guards/             # 路由守衛
│   ├── shared/                 # 共享模組
│   │   ├── components/         # 共享組件
│   │   ├── directives/         # 自定義指令
│   │   ├── pipes/              # 自定義管道
│   │   └── services/           # 共享服務
│   ├── features/               # 功能模組
│   │   ├── product/            # 商品管理
│   │   ├── cart/               # 購物車
│   │   ├── checkout/           # 結帳流程
│   │   ├── user/               # 用戶管理
│   │   ├── order/              # 訂單管理
│   │   └── admin/              # 管理後台
│   └── layouts/                # 佈局組件
│       ├── main-layout/        # 主要佈局
│       └── admin-layout/       # 管理後台佈局
├── assets/                     # 靜態資源
├── environments/               # 環境配置
└── styles/                     # 全域樣式
```

### 3.2 狀態管理設計
使用 Angular Signals 進行狀態管理：

```typescript
// 購物車狀態管理
export class CartService {
  private cartItems = signal<CartItem[]>([]);
  private totalPrice = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  
  addItem(item: Product) {
    // 添加商品到購物車
  }
  
  removeItem(itemId: string) {
    // 從購物車移除商品
  }
}
```

### 3.3 SSR 配置
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideClientHydration(),
    // 其他提供者
  ]
};
```

## 4. 後端架構設計

### 4.1 ORPC 服務結構
```
server/
├── services/                   # ORPC 服務
│   ├── product.service.ts     # 商品服務
│   ├── cart.service.ts        # 購物車服務
│   ├── order.service.ts       # 訂單服務
│   ├── user.service.ts        # 用戶服務
│   └── payment.service.ts     # 支付服務
├── middleware/                 # 中介軟體
│   ├── auth.middleware.ts     # 認證中介軟體
│   ├── validation.middleware.ts
│   └── logging.middleware.ts
├── database/                   # 資料庫相關
│   ├── prisma/                # Prisma 配置
│   └── migrations/            # 資料庫遷移
├── shared/                     # 共享代碼
│   ├── types/                 # 類型定義
│   ├── schemas/               # 驗證模式
│   └── utils/                 # 工具函數
└── server.ts                  # 伺服器入口
```

### 4.2 ORPC 服務定義範例
```typescript
// services/product.service.ts
import { os } from '@orpc/server'
import { z } from 'zod'

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().positive(),
  description: z.string().optional(),
  images: z.array(z.string().url()),
  categoryId: z.string().uuid(),
  stock: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const getProducts = os
  .input(z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    categoryId: z.string().uuid().optional(),
    search: z.string().optional()
  }))
  .output(z.object({
    products: z.array(ProductSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    })
  }))
  .handler(async ({ input }) => {
    // 實作商品查詢邏輯
    return await productRepository.findMany(input)
  })

export const productRouter = {
  getProducts,
  getProductById: getProductById,
  createProduct: createProduct,
  updateProduct: updateProduct,
  deleteProduct: deleteProduct
}
```

## 5. 資料庫設計

### 5.1 核心實體關係
```sql
-- 用戶表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 商品分類表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 購物車表
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 訂單表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Prisma Schema
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  cartItems CartItem[]
  orders    Order[]
}

model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?
  parent      Category?  @relation("CategoryParent", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryParent")
  products    Product[]
  createdAt   DateTime   @default(now())
}

model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  cartItems   CartItem[]
  orderItems  OrderItem[]
}
```

## 6. API 設計

### 6.1 RESTful API 端點
```
GET    /api/products              # 獲取商品列表
GET    /api/products/:id          # 獲取單個商品
POST   /api/products              # 創建商品
PUT    /api/products/:id          # 更新商品
DELETE /api/products/:id          # 刪除商品

GET    /api/cart                  # 獲取購物車
POST   /api/cart/items            # 添加商品到購物車
PUT    /api/cart/items/:id        # 更新購物車商品
DELETE /api/cart/items/:id        # 從購物車移除商品

POST   /api/orders                # 創建訂單
GET    /api/orders                # 獲取訂單列表
GET    /api/orders/:id            # 獲取單個訂單
PUT    /api/orders/:id/status     # 更新訂單狀態
```

### 6.2 ORPC 服務路由
```typescript
// 主路由配置
export const appRouter = {
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  user: userRouter,
  payment: paymentRouter
}
```

## 7. 安全設計

### 7.1 認證與授權
- JWT Token 認證
- 角色基礎存取控制 (RBAC)
- API 端點權限驗證
- 密碼加密 (bcrypt)

### 7.2 資料安全
- 輸入驗證與清理
- SQL 注入防護
- XSS 攻擊防護
- CSRF 保護

### 7.3 通信安全
- HTTPS 強制使用
- CORS 適當配置
- 敏感資料加密
- API 速率限制

## 8. 效能優化

### 8.1 前端優化
- 程式碼分割 (Code Splitting)
- 懶載入 (Lazy Loading)
- 圖片優化與懶載入
- 快取策略

### 8.2 後端優化
- 資料庫查詢優化
- Redis 快取機制
- 連線池管理
- 負載平衡

### 8.3 SSR 優化
- 預渲染策略
- 部分水合
- 關鍵路徑優化

## 9. 監控與日誌

### 9.1 應用監控
- 效能指標追蹤
- 錯誤率監控
- 使用者行為分析
- 業務指標監控

### 9.2 日誌系統
- 結構化日誌
- 日誌等級分類
- 集中式日誌收集
- 日誌分析與告警

## 10. 部署架構

### 10.1 容器化
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 10.2 Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/angorpc
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=angorpc
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 11. 開發環境配置

### 11.1 環境變數
```env
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/angorpc_dev
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:4200
```

### 11.2 開發腳本
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "ng serve",
    "dev:server": "nodemon server/server.ts",
    "build": "ng build --ssr && npm run build:server",
    "build:server": "tsc -p server/tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

## 12. 測試策略

### 12.1 前端測試
- 單元測試 (Jest + Angular Testing Utilities)
- 整合測試 (Cypress)
- E2E 測試 (Playwright)

### 12.2 後端測試
- 單元測試 (Jest)
- 整合測試 (Supertest)
- API 測試 (Postman/Newman)

## 13. 文檔維護

### 13.1 API 文檔
- 自動生成 (OpenAPI/Swagger)
- 互動式文檔
- 版本控制

### 13.2 代碼文檔
- JSDoc 註解
- README 文件
- 架構決策記錄 (ADR)

---

**文檔狀態**: 草稿  
**下次審查**: 2025年11月2日  
**審查人員**: 技術團隊
