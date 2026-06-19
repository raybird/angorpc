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

// 更新會員資料輸入 Schema
export const UpdateProfileInputSchema = z.object({
  firstName: z.string().min(1, "名字不能為空").max(100).optional(),
  lastName: z.string().min(1, "姓氏不能為空").max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional().nullable(),
  password: z.string().min(8, "密碼長度至少需 8 碼").max(100).optional(),
});

// 用戶常用地址 Schema
export const UserAddressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  recipientName: z.string().min(1, "收件人姓名不能為空"),
  phone: z.string().min(8, "電話格式不符"),
  address: z.string().min(5, "收件地址需完整填寫"),
  postalCode: z.string().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// 新增常用地址輸入 Schema
export const CreateAddressInputSchema = z.object({
  recipientName: z.string().min(1, "收件人姓名不能為空").max(100),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式"),
  address: z.string().min(5, "收件地址需完整填寫").max(255),
  postalCode: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().default(false),
});

// 更新常用地址輸入 Schema
export const UpdateAddressInputSchema = z.object({
  id: z.string().uuid("不合法的地址 ID 格式"),
  recipientName: z.string().min(1, "收件人姓名不能為空").max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional(),
  address: z.string().min(5, "收件地址需完整填寫").max(255).optional(),
  postalCode: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});

// 商品變體 Schema 結構
export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().nullable().optional(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  attributes: z.record(z.string(), z.any()),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
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
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
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
  variants: z.array(ProductVariantSchema),
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
  variants: z.array(z.object({
    sku: z.string().nullable().optional(),
    name: z.string(),
    price: z.number(),
    stock: z.number(),
    attributes: z.record(z.string(), z.any()),
  })).optional(),
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
  variants: z.array(z.object({
    id: z.string().uuid().optional(),
    sku: z.string().nullable().optional(),
    name: z.string(),
    price: z.number(),
    stock: z.number(),
    attributes: z.record(z.string(), z.any()),
  })).optional(),
});

// 購物車項目詳細 Schema
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  product: ProductSchema,
  variant: ProductVariantSchema.nullable().optional(),
});

// 新增商品至購物車輸入 Schema
export const AddCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  variantId: z.string().uuid("不合法的變體 ID 格式").optional().nullable(),
  quantity: z.number().int().positive("商品數量必須大於 0").default(1),
});

// 更新購物車商品數量輸入 Schema
export const UpdateCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  variantId: z.string().uuid("不合法的變體 ID 格式").optional().nullable(),
  quantity: z.number().int().positive("商品數量必須大於 0"),
});

// 移除購物車商品輸入 Schema
export const RemoveCartItemInputSchema = z.object({
  productId: z.string().uuid("不合法的商品 ID 格式"),
  variantId: z.string().uuid("不合法的變體 ID 格式").optional().nullable(),
});

// 查詢購物車輸出 Schema
export const GetCartOutputSchema = z.object({
  items: z.array(CartItemSchema),
  totalPrice: z.number(),
});

// 地址 Schema
export const AddressSchema = z.object({
  recipientName: z.string().min(1, "收件人姓名不能為空"),
  phone: z.string().min(8, "電話格式不符"),
  address: z.string().min(5, "收件地址需完整填寫"),
  postalCode: z.string().optional(),
});

// 建立訂單輸入 Schema
export const CreateOrderInputSchema = z.object({
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive()
  })).min(1, "購物車至少需包含一項商品"),
  couponCode: z.string().optional(),
});

// 建立訂單輸出 Schema
export const CreateOrderOutputSchema = z.object({
  orderId: z.string().uuid(),
  totalAmount: z.number(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  createdAt: z.date().or(z.string()),
});

// 優惠券主要 Schema 結構
export const CouponSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number(),
  minSpend: z.number(),
  isActive: z.boolean(),
  expiresAt: z.date().or(z.string()).nullable(),
});

// 驗證優惠碼輸入 Schema
export const ValidateCouponInputSchema = z.object({
  code: z.string().min(1, "優惠碼不能為空"),
  orderAmount: z.number().nonnegative(),
});

// 驗證優惠碼輸出 Schema
export const ValidateCouponOutputSchema = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
  coupon: z.object({
    id: z.string().uuid(),
    code: z.string(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number(),
    minSpend: z.number(),
  }).optional(),
  discountAmount: z.number().optional(),
});

// 查詢優惠券列表輸入 Schema
export const GetCouponsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

// 查詢優惠券列表輸出 Schema
export const GetCouponsOutputSchema = z.object({
  coupons: z.array(CouponSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 建立優惠券輸入 Schema
export const CreateCouponInputSchema = z.object({
  code: z.string().min(1, "優惠碼不能為空").max(50, "優惠碼長度不能超過 50 個字元"),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive("折扣面額必須大於 0"),
  minSpend: z.number().nonnegative("最低消費金額不能為負數").default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.date().or(z.string()).nullable().optional(),
}).refine(data => {
  if (data.discountType === 'PERCENTAGE') {
    return data.value <= 100;
  }
  return true;
}, {
  message: "百分比折扣面額不能大於 100",
  path: ["value"]
});

// 更新優惠券輸入 Schema
export const UpdateCouponInputSchema = z.object({
  id: z.string().uuid("不合法的優惠券 ID 格式"),
  code: z.string().min(1).max(50).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  value: z.number().positive("折扣面額必須大於 0").optional(),
  minSpend: z.number().nonnegative("最低消費金額不能為負數").optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.date().or(z.string()).nullable().optional(),
}).refine(data => {
  if (data.discountType === 'PERCENTAGE' && data.value !== undefined) {
    return data.value <= 100;
  }
  return true;
}, {
  message: "百分比折扣面額不能大於 100",
  path: ["value"]
});

// 查詢歷史訂單輸入 Schema
export const GetOrdersInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
});

// 查詢歷史訂單輸出 Schema
export const GetOrdersOutputSchema = z.object({
  orders: z.array(z.object({
    id: z.string().uuid(),
    totalAmount: z.number(),
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    createdAt: z.date().or(z.string()),
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 查詢單一訂單詳情輸出 Schema
export const OrderDetailOutputSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  totalAmount: z.number(),
  discountAmount: z.number().optional(),
  couponCode: z.string().nullable().optional(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  orderItems: z.array(z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
    name: z.string(),
    variantName: z.string().optional().nullable(),
    price: z.number(),
    quantity: z.number(),
  })),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// 查詢分類清單輸出 Schema
export const GetCategoriesOutputSchema = z.array(z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
}));

// 更新訂單狀態輸入 Schema
export const UpdateOrderStatusInputSchema = z.object({
  id: z.string().uuid("不合法的訂單 ID 格式"),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

// 查詢用戶列表輸入 Schema
export const GetUsersInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

// 查詢用戶列表輸出 Schema
export const GetUsersOutputSchema = z.object({
  users: z.array(z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    phone: z.string().nullable(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.date().or(z.string()),
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 更新用戶角色輸入 Schema
export const UpdateUserRoleInputSchema = z.object({
  id: z.string().uuid("不合法的用戶 ID 格式"),
  role: z.enum(["USER", "ADMIN"]),
});

// 用戶統計數據輸出 Schema
export const UserStatsOutputSchema = z.object({
  totalOrders: z.number(),
  totalSpent: z.number(),
});

// 支付訂單輸入 Schema
export const PayOrderInputSchema = z.object({
  orderId: z.string().uuid("不合法的訂單 ID 格式"),
  cardNumber: z.string().regex(/^[0-9]{16}$/, "信用卡號必須為 16 位數字"),
  cardHolder: z.string().min(1, "持卡人姓名不能為空"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "有效期格式必須為 MM/YY"),
  cvv: z.string().regex(/^[0-9]{3}$/, "安全碼必須為 3 位數字"),
});

// 支付訂單輸出 Schema
export const PayOrderOutputSchema = z.object({
  success: z.boolean(),
  orderId: z.string().uuid(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  errorMessage: z.string().optional(),
});

// 後台 Dashboard 數據輸出 Schema
export const GetDashboardStatsOutputSchema = z.object({
  totalSales: z.number(),
  ordersCount: z.number(),
  productsCount: z.number(),
  customersCount: z.number(),
  recentOrders: z.array(z.object({
    id: z.string().uuid(),
    customerName: z.string(),
    totalAmount: z.number(),
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    createdAt: z.date().or(z.string()),
  })),
  salesHistory: z.array(z.object({
    date: z.string(),
    amount: z.number(),
  })),
  categorySales: z.array(z.object({
    categoryName: z.string(),
    amount: z.number(),
  })),
});


