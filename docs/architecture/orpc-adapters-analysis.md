# oRPC Adapters 分析與整合方案

## oRPC 概述

根據 [oRPC GitHub 儲存庫](https://github.com/unnoq/orpc) 的資訊，oRPC 是一個強大的 RPC 和 OpenAPI 組合，提供端到端類型安全的 API 開發體驗。

### 核心特性
- 🔗 **端到端類型安全**: 確保從客戶端到伺服器的類型安全
- 📘 **一級 OpenAPI 支援**: 完全符合 OpenAPI 標準
- 📝 **合約優先開發**: 可選的 API 合約定義
- 🔍 **一級 OpenTelemetry**: 無縫整合可觀測性
- ⚙️ **框架整合**: 支援 TanStack Query、SWR、Pinia Colada 等
- 🚀 **伺服器動作**: 完全相容 React Server Actions
- 🔠 **標準模式支援**: 支援 Zod、Valibot、ArkType 等
- 🗃️ **原生類型**: 支援 Date、File、Blob、BigInt、URL 等
- ⏱️ **懶載入路由**: 提升冷啟動時間
- 📡 **SSE 和串流**: 完整的類型安全支援
- 🌍 **多運行時支援**: 支援 Cloudflare、Deno、Bun、Node.js 等

## 可用的 Adapters

### 1. Node.js 適配器
```typescript
import { createServer } from 'node:http'
import { RPCHandler } from '@orpc/server/node'
import { CORSPlugin } from '@orpc/server/plugins'

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()]
})

const server = createServer(async (req, res) => {
  const result = await handler.handle(req, res, {
    context: { headers: req.headers }
  })
  if (!result.matched) {
    res.statusCode = 404
    res.end('No procedure matched')
  }
})
```

### 2. Express 適配器
```typescript
import express from 'express'
import { createORPCHandler } from '@orpc/server/express'

const app = express()

// 建立 oRPC 處理器
const orpcHandler = createORPCHandler(router, {
  plugins: [new CORSPlugin()]
})

// 掛載到 Express 應用
app.use('/api', orpcHandler)
```

### 3. 其他框架適配器
- **Next.js**: `@orpc/next`
- **Astro**: `@orpc/astro`
- **Nuxt**: `@orpc/nuxt`
- **SvelteKit**: `@orpc/sveltekit`
- **Remix**: `@orpc/remix`

## 在 Angular SSR 中的整合方案

### 方案一：Express 適配器 (推薦)

```typescript
// server.ts
import express from 'express'
import { ngExpressEngine } from '@nguniversal/express-engine'
import { createORPCHandler } from '@orpc/server/express'
import { CORSPlugin } from '@orpc/server/plugins'
import { router } from './api/router'

const app = express()

// 建立 oRPC 處理器
const orpcHandler = createORPCHandler(router, {
  plugins: [new CORSPlugin()]
})

// 設定 oRPC API 路由
app.use('/api', orpcHandler)

// 設定 Angular SSR
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModule,
  providers: [provideServerRendering()]
}))

// 靜態資源
app.use(express.static('dist/angorpc/browser'))

// Angular 路由 (放在最後)
app.get('*', (req, res) => {
  res.render('index.html', { req })
})
```

### 方案二：Node.js HTTP 適配器

```typescript
// server.ts
import { createServer } from 'node:http'
import { RPCHandler } from '@orpc/server/node'
import { ngExpressEngine } from '@nguniversal/express-engine'

const orpcHandler = new RPCHandler(router, {
  plugins: [new CORSPlugin()]
})

const server = createServer(async (req, res) => {
  // 處理 oRPC API 請求
  if (req.url?.startsWith('/api')) {
    const result = await orpcHandler.handle(req, res, {
      context: { headers: req.headers }
    })
    if (result.matched) {
      return
    }
  }
  
  // 處理 Angular SSR 請求
  // ... SSR 邏輯
})
```

## 客戶端整合

### Angular 服務中使用 oRPC

```typescript
// client/services/api.service.ts
import { Injectable } from '@angular/core'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { router } from '../../server/api/router'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private orpc: RouterClient<typeof router>

  constructor() {
    const link = new RPCLink({
      url: '/api', // 相對路徑，在 SSR 中會自動解析
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    this.orpc = createORPCClient(link)
  }

  // 使用類型安全的 API 呼叫
  async getUsers() {
    return await this.orpc.user.list()
  }

  async createUser(data: CreateUserInput) {
    return await this.orpc.user.create(data)
  }
}
```

## 共享類型定義

### 1. API 路由定義

```typescript
// shared/api/router.ts
import { os } from '@orpc/server'
import * as z from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date()
})

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
})

export const listUsers = os
  .input(z.object({
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().optional()
  }))
  .output(z.array(UserSchema))
  .handler(async ({ input }) => {
    // 實作邏輯
    return []
  })

export const createUser = os
  .input(CreateUserSchema)
  .output(UserSchema)
  .handler(async ({ input }) => {
    // 實作邏輯
    return { id: '1', name: input.name, email: input.email, createdAt: new Date() }
  })

export const router = {
  user: {
    list: listUsers,
    create: createUser
  }
}
```

### 2. 類型匯出

```typescript
// shared/types/index.ts
export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type Router = typeof router
```

## 環境配置

### 1. 開發環境

```typescript
// 檢查執行環境
import { isPlatformBrowser } from '@angular/common'
import { PLATFORM_ID, Inject } from '@angular/core'

constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    // 只在瀏覽器環境初始化客戶端
    this.initializeClient()
  }
}
```

### 2. 生產環境

```typescript
// 環境變數配置
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api'
  : '/api'
```

## 套件依賴

```json
{
  "dependencies": {
    "@orpc/server": "^1.10.2",
    "@orpc/client": "^1.10.2",
    "@orpc/server/express": "^1.10.2",
    "@orpc/client/fetch": "^1.10.2",
    "zod": "^3.22.0"
  }
}
```

## 最佳實踐

### 1. 錯誤處理

```typescript
// 統一的錯誤處理
export const withErrorHandling = (handler: any) => {
  return async (input: any, context: any) => {
    try {
      return await handler(input, context)
    } catch (error) {
      console.error('API Error:', error)
      throw new ORPCError('INTERNAL_ERROR', 'Internal server error')
    }
  }
}
```

### 2. 認證中介軟體

```typescript
// 認證中介軟體
export const authMiddleware = os
  .$context<{ headers: IncomingHttpHeaders }>()
  .use(({ context, next }) => {
    const token = context.headers.authorization?.split(' ')[1]
    if (!token) {
      throw new ORPCError('UNAUTHORIZED', 'Authentication required')
    }
    
    const user = parseJWT(token)
    return next({ context: { user } })
  })
```

### 3. 日誌記錄

```typescript
// 日誌中介軟體
export const loggingMiddleware = os
  .use(({ input, next }) => {
    console.log('API Call:', input)
    const start = Date.now()
    
    return next().then(result => {
      console.log(`API Call completed in ${Date.now() - start}ms`)
      return result
    })
  })
```

## 總結

oRPC 提供了強大的適配器系統，特別適合與 Angular SSR 整合：

- ✅ **Express 適配器**: 最適合 Angular Universal 的整合方式
- ✅ **類型安全**: 端到端的 TypeScript 支援
- ✅ **OpenAPI 支援**: 自動生成 API 文檔
- ✅ **多環境支援**: 支援各種運行時環境
- ✅ **豐富的生態**: 與多個前端框架整合

這種整合方式將為 AngoRPC 專案提供強大的類型安全和開發體驗。

---

最後更新：2025年10月26日
