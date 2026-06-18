import { z } from 'zod';

// Hello World 驗證 Schema
export const HelloInputSchema = z.object({
  name: z.string().min(1, "名字不能為空").default("World"),
});

export const HelloOutputSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
});

// 用戶登入驗證 Schema
export const LoginInputSchema = z.object({
  email: z.string().email("不合法的 Email 格式"),
  password: z.string().min(1, "密碼不能為空"),
});

export const LoginOutputSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});

// 用戶註冊驗證 Schema
export const RegisterInputSchema = z.object({
  email: z.string().email("不合法的 Email 格式").max(255),
  password: z.string().min(8, "密碼長度至少需 8 碼").max(100),
  firstName: z.string().min(1, "名字不能為空").max(100),
  lastName: z.string().min(1, "姓氏不能為空").max(100),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional(),
});

export const RegisterOutputSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});

// 會員個人資料驗證 Schema
export const ProfileOutputSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.date().or(z.string()),
});

// 商品主要 Schema 結構
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  categoryId: z.string().uuid(),
  stock: z.number(),
  isActive: z.boolean(),
  createdAt: z.date().or(z.string()),
});

// 分頁商品查詢輸入 Schema
export const GetProductsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeInactive: z.boolean().default(false),
});

// 分頁商品查詢輸出 Schema
export const GetProductsOutputSchema = z.object({
  products: z.array(ProductSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 查詢單一商品詳情輸出 Schema
export const ProductDetailOutputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  version: z.number(),
  isActive: z.boolean(),
  categoryId: z.string().uuid(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// 建立商品輸入 Schema
export const CreateProductInputSchema = z.object({
  name: z.string().min(1, "商品名稱不能為空").max(255),
  slug: z.string().min(1, "商品 Slug 不能為空").max(255),
  description: z.string().optional(),
  price: z.number().positive("商品價格必須大於 0"),
  categoryId: z.string().uuid("不合法的分類 ID 格式"),
  stock: z.number().int().nonnegative("庫存量不能為負數").default(0),
  isActive: z.boolean().default(true),
});

// 更新商品輸入 Schema
export const UpdateProductInputSchema = z.object({
  id: z.string().uuid("不合法的商品 ID 格式"),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

// 購物車項目詳細 Schema
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  product: ProductSchema,
});

// 新增商品至購物車輸入 Schema
export const AddCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  quantity: z.number().int().positive("商品數量必須大於 0").default(1),
});

// 更新購物車商品數量輸入 Schema
export const UpdateCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  quantity: z.number().int().positive("商品數量必須大於 0"),
});

// 移除購物車商品輸入 Schema
export const RemoveCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
});

// 查詢購物車輸出 Schema
export const GetCartOutputSchema = z.object({
  items: z.array(CartItemSchema),
  totalPrice: z.number(),
});

