# Angular SSR 與 ORPC 整合架構

## 整合可行性分析

**✅ 完全可行！** Angular SSR 伺服器與 ORPC 可以完美整合，形成統一的後端服務。

## 架構設計

### 1. 統一伺服器架構

```
┌─────────────────────────────────────────┐
│            Node.js Express 伺服器        │
├─────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐│
│  │   Angular SSR   │  │   ORPC Server   ││
│  │   (頁面渲染)     │  │   (API 服務)    ││
│  └─────────────────┘  └─────────────────┘│
├─────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐│
│  │   靜態資源      │  │   共享類型定義  ││
│  │   (CSS/JS)      │  │   (TypeScript)  ││
│  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────┘
```

### 2. 請求路由分配

```typescript
// server.ts
import express from 'express';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { ORPCServer } from '@orpc/server';

const app = express();

// Angular SSR 路由
app.get('*', ngExpressEngine({
  bootstrap: AppServerModule,
  providers: [provideServerRendering()]
}));

// ORPC API 路由
app.use('/api', orpcServer.expressMiddleware());

// 靜態資源
app.use(express.static('dist/angorpc/browser'));
```

## 整合優勢

### 1. **統一部署**
- 單一伺服器實例
- 簡化部署流程
- 減少基礎設施成本

### 2. **類型安全**
- 前後端共享 TypeScript 類型
- 編譯時類型檢查
- 自動生成客戶端代碼

### 3. **開發體驗**
- 統一的開發環境
- 熱重載支援
- 統一的錯誤處理

### 4. **效能優化**
- 減少網路延遲
- 共享快取機制
- 優化的序列化

## 實作方案

### 方案一：完全整合 (推薦)

```typescript
// server.ts
import express from 'express';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { ORPCServer } from '@orpc/server';
import { userService } from './services/user.service';
import { productService } from './services/product.service';

const app = express();

// 建立 ORPC 伺服器
const orpcServer = new ORPCServer({
  services: [userService, productService]
});

// 設定 ORPC 路由
app.use('/api', orpcServer.expressMiddleware());

// 設定 Angular SSR
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModule,
  providers: [provideServerRendering()]
}));

// 靜態資源
app.use(express.static('dist/angorpc/browser'));

// Angular 路由 (放在最後)
app.get('*', (req, res) => {
  res.render('index.html', { req });
});
```

### 方案二：微服務分離

```typescript
// 主伺服器 (SSR)
const ssrServer = express();
ssrServer.engine('html', ngExpressEngine({
  bootstrap: AppServerModule
}));

// API 伺服器 (ORPC)
const apiServer = express();
apiServer.use('/api', orpcServer.expressMiddleware());

// 反向代理設定
ssrServer.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
}));
```

## 共享類型定義

### 1. 專案結構

```
src/
├── shared/                 # 共享代碼
│   ├── types/             # 類型定義
│   │   ├── user.types.ts
│   │   ├── product.types.ts
│   │   └── index.ts
│   ├── schemas/           # 驗證模式
│   │   ├── user.schema.ts
│   │   └── product.schema.ts
│   └── constants/         # 常數定義
├── server/                # 伺服器端代碼
│   ├── services/          # ORPC 服務
│   ├── middleware/        # 中介軟體
│   └── server.ts          # 伺服器入口
└── client/                # 客戶端代碼
    ├── components/        # Angular 組件
    ├── services/          # Angular 服務
    └── app.module.ts
```

### 2. 共享類型範例

```typescript
// shared/types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// shared/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8)
});
```

## ORPC 服務定義

```typescript
// server/services/user.service.ts
import { ORPCServer } from '@orpc/server';
import { CreateUserSchema, UserSchema } from '../../shared/schemas/user.schema';
import { User, CreateUserRequest } from '../../shared/types/user.types';

export const userService = {
  name: 'UserService',
  version: '1.0.0',
  methods: {
    getUserById: {
      input: z.object({ id: z.string().uuid() }),
      output: UserSchema,
      handler: async ({ id }) => {
        // 實作邏輯
        return await getUserFromDatabase(id);
      }
    },
    createUser: {
      input: CreateUserSchema,
      output: UserSchema,
      handler: async (data: CreateUserRequest) => {
        // 實作邏輯
        return await createUserInDatabase(data);
      }
    }
  }
};
```

## Angular 客戶端整合

```typescript
// client/services/user.service.ts
import { Injectable } from '@angular/core';
import { ORPCClient } from '@orpc/client';
import { User, CreateUserRequest } from '../../shared/types/user.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private orpcClient: ORPCClient;

  constructor() {
    this.orpcClient = new ORPCClient({
      baseUrl: '/api'
    });
  }

  async getUserById(id: string): Promise<User> {
    return await this.orpcClient.call('UserService', 'getUserById', { id });
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return await this.orpcClient.call('UserService', 'createUser', data);
  }
}
```

## 環境配置

### 1. 開發環境

```typescript
// server.ts (開發模式)
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  // 開發模式：啟用熱重載
  app.use('/api', orpcServer.expressMiddleware());
} else {
  // 生產模式：優化配置
  app.use('/api', orpcServer.expressMiddleware());
}
```

### 2. 生產環境

```typescript
// 建置腳本
"scripts": {
  "build:ssr": "ng build --ssr",
  "serve:ssr": "node dist/angorpc/server/server.js",
  "build:all": "npm run build:ssr && npm run build:api"
}
```

## 注意事項

### 1. SSR 環境限制
```typescript
// 檢查執行環境
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    // 只在瀏覽器環境執行
    this.initializeClient();
  }
}
```

### 2. API 路徑處理
```typescript
// 在 SSR 中使用絕對路徑
const apiUrl = isPlatformBrowser(this.platformId) 
  ? '/api' 
  : 'http://localhost:4200/api';
```

### 3. 錯誤處理
```typescript
// 統一的錯誤處理
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});
```

## 部署建議

### 1. Docker 配置
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 4200
CMD ["node", "dist/angorpc/server/server.js"]
```

### 2. 環境變數
```env
NODE_ENV=production
PORT=4200
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

## 總結

Angular SSR 與 ORPC 的整合提供了：

- ✅ **統一架構**: 單一伺服器處理 SSR 和 API
- ✅ **類型安全**: 端到端 TypeScript 支援
- ✅ **開發效率**: 統一的開發環境
- ✅ **部署簡化**: 單一部署單元
- ✅ **效能優化**: 減少網路延遲

這種架構特別適合中小型專案，可以大幅簡化開發和部署流程。

---

最後更新：2025年10月26日
