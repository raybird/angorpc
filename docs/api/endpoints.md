# AngoRPC 電商平台詳細 API 與 oRPC 規格書

本文件定義 AngoRPC 電商平台所有後端服務 API。API 採用 [oRPC](https://github.com/middleapi/orpc) 框架，透過 TypeScript 進行端到端類型安全推導，並使用 Zod 作為執行期的輸入與輸出驗證工具。

---

## 1. 全域 API 規範與錯誤碼

所有 API 方法在發生錯誤時，均會回傳符合 `docs/api/design.md` 規範的結構化錯誤：

```typescript
// 錯誤回應格式
interface ApiError {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, any>; // 當 VALIDATION_ERROR 時，用來回傳欄位錯誤細節
  timestamp: string;
}
```

---

## 2. 核心 API 模組 Procedure 定義

### 2.1 用戶與認證模組 (userRouter)

命名空間：`user`

#### 2.1.1 註冊用戶 (user.register)
* **功能描述**：新使用者建立帳戶。
* **權限要求**：公開 (Public)
* **輸入驗證 Schema (Zod)**：
```typescript
const RegisterInput = z.object({
  email: z.string().email("不合法的 Email 格式").max(255),
  password: z.string().min(8, "密碼長度至少需 8 碼").max(100),
  firstName: z.string().min(1, "名字不能為空").max(100),
  lastName: z.string().min(1, "姓氏不能為空").max(100),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional()
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const RegisterOutput = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"])
  })
})
```

#### 2.1.2 登入用戶 (user.login)
* **功能描述**：使用 Email 與密碼換取 JWT Token。
* **權限要求**：公開 (Public)
* **輸入驗證 Schema (Zod)**：
```typescript
const LoginInput = z.object({
  email: z.string().email("不合法的 Email 格式"),
  password: z.string().min(1, "密碼不能為空")
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const LoginOutput = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"])
  })
})
```

#### 2.1.3 取得個人資料 (user.getProfile)
* **功能描述**：取得當前登入使用者的個人資料。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：`z.object({})` (無輸入)
* **輸出驗證 Schema (Zod)**：
```typescript
const ProfileOutput = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.date()
})
```

---

### 2.2 商品目錄模組 (productRouter)

命名空間：`product`

#### 2.2.1 查詢商品列表 (product.getProducts)
* **功能描述**：分頁查詢並篩選已上架商品（前台使用，或後台管理商品清單）。
* **權限要求**：公開 (Public)
* **輸入驗證 Schema (Zod)**：
```typescript
const GetProductsInput = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeInactive: z.boolean().default(false) // 僅限 ADMIN 傳入 true
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const GetProductsOutput = z.object({
  products: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    categoryId: z.string().uuid(),
    stock: z.number(),
    isActive: z.boolean(),
    createdAt: z.date()
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
})
```

#### 2.2.2 查詢單一商品 (product.getProductById)
* **功能描述**：依據商品 ID 或 Slug 查詢詳細資料。
* **權限要求**：公開 (Public)
* **輸入驗證 Schema (Zod)**：
```typescript
const GetProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional()
}).refine(data => data.id || data.slug, "必須提供 id 或 slug")
```
* **輸出驗證 Schema (Zod)**：
```typescript
const ProductDetailOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  isActive: z.boolean(),
  categoryId: z.string().uuid(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string()
  }),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

#### 2.2.3 建立新商品 (product.createProduct)
* **功能描述**：新增一件商品。
* **權限要求**：僅限管理員 (Admin)
* **輸入驗證 Schema (Zod)**：
```typescript
const CreateProductInput = z.object({
  name: z.string().min(1, "商品名稱不能為空").max(255),
  slug: z.string().min(1, "商品 Slug 不能為空").max(255),
  description: z.string().optional(),
  price: z.number().positive("商品價格必須大於 0"),
  categoryId: z.string().uuid("不合法的分類 ID 格式"),
  stock: z.number().int().nonnegative("庫存量不能為負數").default(0),
  isActive: z.boolean().default(true)
})
```
* **輸出驗證 Schema (Zod)**：與 `ProductDetailOutput` 一致。

#### 2.2.4 更新商品 (product.updateProduct)
* **功能描述**：編輯現有商品欄位。
* **權限要求**：僅限管理員 (Admin)
* **輸入驗證 Schema (Zod)**：
```typescript
const UpdateProductInput = z.object({
  id: z.string().uuid("不合法的商品 ID 格式"),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
})
```
* **輸出驗證 Schema (Zod)**：與 `ProductDetailOutput` 一致。

---

### 2.3 購物車模組 (cartRouter)

命名空間：`cart`

#### 2.3.1 獲取購物車內容 (cart.getCart)
* **功能描述**：取得當前登入用戶的購物車清單。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：`z.object({})` (無輸入)
* **輸出驗證 Schema (Zod)**：
```typescript
const GetCartOutput = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    stock: z.number(), // 提供前端庫存比對
    isActive: z.boolean()
  })),
  totalPrice: z.number()
})
```

#### 2.3.2 新增商品至購物車 (cart.addItem)
* **功能描述**：將商品加入購物車，若已存在則累加數量。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：
```typescript
const AddCartItemInput = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  quantity: z.number().int().positive("加入數量必須大於 0")
})
```
* **輸出驗證 Schema (Zod)**：與 `GetCartOutput` 一致。

#### 2.3.3 修改購物車商品數量 (cart.updateItem)
* **功能描述**：直接覆蓋修改購物車內某商品的購買數量。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：
```typescript
const UpdateCartItemInput = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive("數量必須大於 0")
})
```
* **輸出驗證 Schema (Zod)**：與 `GetCartOutput` 一致。

#### 2.3.4 移除購物車商品 (cart.removeItem)
* **功能描述**：從購物車中移除某項商品。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：
```typescript
const RemoveCartItemInput = z.object({
  productId: z.string().uuid()
})
```
* **輸出驗證 Schema (Zod)**：與 `GetCartOutput` 一致。

---

### 2.4 訂單與結帳模組 (orderRouter)

命名空間：`order`

#### 2.4.1 建立訂單 / 結帳下單 (order.createOrder)
* **功能描述**：將用戶指定的商品扣庫存並成立訂單。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：
```typescript
const AddressSchema = z.object({
  recipientName: z.string().min(1, "收件人姓名不能為空"),
  phone: z.string().min(8, "電話格式不符"),
  address: z.string().min(5, "收件地址需完整填寫"),
  postalCode: z.string().optional()
})

const CreateOrderInput = z.object({
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1, "購物車至少需包含一項商品")
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const CreateOrderOutput = z.object({
  orderId: z.string().uuid(),
  totalAmount: z.number(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  createdAt: z.date()
})
```

#### 2.4.2 查詢使用者訂單歷史 (order.getOrders)
* **功能描述**：查詢目前登入用戶的歷史訂單分頁。如果是 ADMIN，可查全平台訂單。
* **權限要求**：需登入 (User)
* **輸入驗證 Schema (Zod)**：
```typescript
const GetOrdersInput = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional()
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const GetOrdersOutput = z.object({
  orders: z.array(z.object({
    id: z.string().uuid(),
    totalAmount: z.number(),
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    createdAt: z.date()
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
})
```

#### 2.4.3 查詢特定訂單詳情 (order.getOrderById)
* **功能描述**：依據訂單 ID 查詢詳細明細。
* **權限要求**：需登入 (User / Admin - 用戶僅限查詢自身訂單，管理員不受限)
* **輸入驗證 Schema (Zod)**：
```typescript
const GetOrderInput = z.object({
  id: z.string().uuid()
})
```
* **輸出驗證 Schema (Zod)**：
```typescript
const OrderDetailOutput = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  totalAmount: z.number(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  orderItems: z.array(z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    name: z.string(),
    price: z.number(), // 下單當下的歷史價格
    quantity: z.number()
  })),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

#### 2.4.4 更新訂單狀態 (order.updateStatus)
* **功能描述**：變更訂單物流或支付狀態（如出貨、退款等）。
* **權限要求**：僅限管理員 (Admin)
* **輸入驗證 Schema (Zod)**：
```typescript
const UpdateOrderStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
})
```
* **輸出驗證 Schema (Zod)**：與 `OrderDetailOutput` 一致。

---
*文件建立日期：2026年06月18日*
*負責人：Antigravity*
