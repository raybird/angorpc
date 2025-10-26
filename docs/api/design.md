# API 設計原則

## 設計理念

AngoRPC 採用 ORPC (OpenRPC) 作為 API 通信協議，實現類型安全、高效能的前後端通信。

## 核心原則

### 1. 類型安全優先
- 所有 API 都使用 TypeScript 定義
- 編譯時類型檢查
- 自動生成客戶端代碼

### 2. 一致性設計
- 統一的命名規範
- 標準化的錯誤處理
- 一致的響應格式

### 3. 效能考量
- 最小化網路請求
- 適當的快取策略
- 高效的序列化

## API 結構設計

### 1. 命名規範

#### 服務命名
```typescript
// 使用 PascalCase，以 Service 結尾
UserService
ProductService
OrderService
```

#### 方法命名
```typescript
// 使用 camelCase，動詞開頭
getUserById
createUser
updateUser
deleteUser
```

#### 類型命名
```typescript
// 使用 PascalCase
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
```

### 2. 錯誤處理

#### 錯誤類型定義
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// 標準錯誤代碼
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

#### 錯誤響應格式
```typescript
interface ErrorResponse {
  success: false;
  error: ApiError;
}
```

### 3. 成功響應格式

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

## ORPC 服務定義

### 1. 基本服務結構

```typescript
// services/user.service.ts
import { ORPCServer } from '@orpc/server';

export const userService = {
  name: 'UserService',
  version: '1.0.0',
  methods: {
    getUserById: {
      input: z.object({
        id: z.string().uuid()
      }),
      output: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string()
      }),
      handler: async ({ id }) => {
        // 實作邏輯
      }
    }
  }
};
```

### 2. 輸入驗證

使用 Zod 進行運行時驗證：

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8)
});

const UpdateUserSchema = CreateUserSchema.partial();
```

### 3. 輸出類型定義

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const UserListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number()
});
```

## 認證與授權

### 1. JWT Token 認證

```typescript
interface AuthContext {
  userId: string;
  role: string;
  permissions: string[];
}

// 在 ORPC 方法中使用
export const protectedMethod = {
  input: z.object({}),
  output: z.object({}),
  handler: async (input, context: AuthContext) => {
    // 受保護的方法
  }
};
```

### 2. 權限檢查

```typescript
const requirePermission = (permission: string) => {
  return (context: AuthContext) => {
    if (!context.permissions.includes(permission)) {
      throw new Error('Insufficient permissions');
    }
  };
};
```

## 分頁與排序

### 1. 分頁參數

```typescript
const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});
```

### 2. 分頁響應

```typescript
const PaginatedResponseSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    })
  });
```

## 快取策略

### 1. 快取標頭

```typescript
interface CacheOptions {
  ttl: number; // 快取時間 (秒)
  tags?: string[]; // 快取標籤
}

const withCache = (options: CacheOptions) => {
  return (handler: Function) => {
    // 快取實作
  };
};
```

### 2. 快取失效

```typescript
// 當資料更新時清除相關快取
const invalidateCache = async (tags: string[]) => {
  // 清除快取邏輯
};
```

## 版本控制

### 1. API 版本策略

```typescript
// 在 URL 中包含版本
/api/v1/users
/api/v2/users

// 或在 ORPC 服務中定義版本
export const userServiceV1 = {
  name: 'UserService',
  version: '1.0.0',
  // ...
};

export const userServiceV2 = {
  name: 'UserService',
  version: '2.0.0',
  // ...
};
```

### 2. 向後相容性

- 新增欄位時使用可選屬性
- 避免移除現有欄位
- 提供遷移指南

## 監控與日誌

### 1. 請求日誌

```typescript
const logRequest = (method: string, input: any, duration: number) => {
  console.log({
    method,
    input: sanitizeInput(input),
    duration,
    timestamp: new Date().toISOString()
  });
};
```

### 2. 效能監控

```typescript
const withMetrics = (handler: Function) => {
  return async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await handler(...args);
      const duration = Date.now() - start;
      recordMetric('api_duration', duration);
      return result;
    } catch (error) {
      recordMetric('api_error', 1);
      throw error;
    }
  };
};
```

---

最後更新：2025年10月26日
