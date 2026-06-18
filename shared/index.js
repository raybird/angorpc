"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrderStatusInputSchema = exports.GetCategoriesOutputSchema = exports.OrderDetailOutputSchema = exports.GetOrdersOutputSchema = exports.GetOrdersInputSchema = exports.UpdateCouponInputSchema = exports.CreateCouponInputSchema = exports.GetCouponsOutputSchema = exports.GetCouponsInputSchema = exports.ValidateCouponOutputSchema = exports.ValidateCouponInputSchema = exports.CouponSchema = exports.CreateOrderOutputSchema = exports.CreateOrderInputSchema = exports.AddressSchema = exports.GetCartOutputSchema = exports.RemoveCartItemInputSchema = exports.UpdateCartItemInputSchema = exports.AddCartItemInputSchema = exports.CartItemSchema = exports.UpdateProductInputSchema = exports.CreateProductInputSchema = exports.ProductDetailOutputSchema = exports.GetProductsOutputSchema = exports.GetProductsInputSchema = exports.ProductSchema = exports.ProfileOutputSchema = exports.RegisterOutputSchema = exports.RegisterInputSchema = exports.LoginOutputSchema = exports.LoginInputSchema = exports.HelloOutputSchema = exports.HelloInputSchema = void 0;
const zod_1 = require("zod");
// Hello World 驗證 Schema
exports.HelloInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "名字不能為空").default("World"),
});
exports.HelloOutputSchema = zod_1.z.object({
    message: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
// 用戶登入驗證 Schema
exports.LoginInputSchema = zod_1.z.object({
    email: zod_1.z.string().email("不合法的 Email 格式"),
    password: zod_1.z.string().min(1, "密碼不能為空"),
});
exports.LoginOutputSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        email: zod_1.z.string().email(),
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        role: zod_1.z.enum(["USER", "ADMIN"]),
    }),
});
// 用戶註冊驗證 Schema
exports.RegisterInputSchema = zod_1.z.object({
    email: zod_1.z.string().email("不合法的 Email 格式").max(255),
    password: zod_1.z.string().min(8, "密碼長度至少需 8 碼").max(100),
    firstName: zod_1.z.string().min(1, "名字不能為空").max(100),
    lastName: zod_1.z.string().min(1, "姓氏不能為空").max(100),
    phone: zod_1.z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional(),
});
exports.RegisterOutputSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        email: zod_1.z.string().email(),
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        role: zod_1.z.enum(["USER", "ADMIN"]),
    }),
});
// 會員個人資料驗證 Schema
exports.ProfileOutputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().nullable(),
    lastName: zod_1.z.string().nullable(),
    phone: zod_1.z.string().nullable(),
    role: zod_1.z.enum(["USER", "ADMIN"]),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
// 商品主要 Schema 結構
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    price: zod_1.z.number(),
    categoryId: zod_1.z.string().uuid(),
    stock: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
// 分頁商品查詢輸入 Schema
exports.GetProductsInputSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    categoryId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    includeInactive: zod_1.z.boolean().default(false),
    minPrice: zod_1.z.number().optional(),
    maxPrice: zod_1.z.number().optional(),
});
// 分頁商品查詢輸出 Schema
exports.GetProductsOutputSchema = zod_1.z.object({
    products: zod_1.z.array(exports.ProductSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
// 查詢單一商品詳情輸出 Schema
exports.ProductDetailOutputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    price: zod_1.z.number(),
    stock: zod_1.z.number(),
    version: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    categoryId: zod_1.z.string().uuid(),
    category: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        slug: zod_1.z.string(),
    }),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
    updatedAt: zod_1.z.date().or(zod_1.z.string()),
});
// 建立商品輸入 Schema
exports.CreateProductInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "商品名稱不能為空").max(255),
    slug: zod_1.z.string().min(1, "商品 Slug 不能為空").max(255),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive("商品價格必須大於 0"),
    categoryId: zod_1.z.string().uuid("不合法的分類 ID 格式"),
    stock: zod_1.z.number().int().nonnegative("庫存量不能為負數").default(0),
    isActive: zod_1.z.boolean().default(true),
});
// 更新商品輸入 Schema
exports.UpdateProductInputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("不合法的商品 ID 格式"),
    name: zod_1.z.string().min(1).max(255).optional(),
    slug: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    stock: zod_1.z.number().int().nonnegative().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// 購物車項目詳細 Schema
exports.CartItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
    updatedAt: zod_1.z.date().or(zod_1.z.string()),
    product: exports.ProductSchema,
});
// 新增商品至購物車輸入 Schema
exports.AddCartItemInputSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("不合法的商品 ID 格式"),
    quantity: zod_1.z.number().int().positive("商品數量必須大於 0").default(1),
});
// 更新購物車商品數量輸入 Schema
exports.UpdateCartItemInputSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("不合法的商品 ID 格式"),
    quantity: zod_1.z.number().int().positive("商品數量必須大於 0"),
});
// 移除購物車商品輸入 Schema
exports.RemoveCartItemInputSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("不合法的商品 ID 格式"),
});
// 查詢購物車輸出 Schema
exports.GetCartOutputSchema = zod_1.z.object({
    items: zod_1.z.array(exports.CartItemSchema),
    totalPrice: zod_1.z.number(),
});
// 地址 Schema
exports.AddressSchema = zod_1.z.object({
    recipientName: zod_1.z.string().min(1, "收件人姓名不能為空"),
    phone: zod_1.z.string().min(8, "電話格式不符"),
    address: zod_1.z.string().min(5, "收件地址需完整填寫"),
    postalCode: zod_1.z.string().optional(),
});
// 建立訂單輸入 Schema
exports.CreateOrderInputSchema = zod_1.z.object({
    shippingAddress: exports.AddressSchema,
    billingAddress: exports.AddressSchema,
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().positive()
    })).min(1, "購物車至少需包含一項商品"),
    couponCode: zod_1.z.string().optional(),
});
// 建立訂單輸出 Schema
exports.CreateOrderOutputSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid(),
    totalAmount: zod_1.z.number(),
    status: zod_1.z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
});
// 優惠券主要 Schema 結構
exports.CouponSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: zod_1.z.number(),
    minSpend: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    expiresAt: zod_1.z.date().or(zod_1.z.string()).nullable(),
});
// 驗證優惠碼輸入 Schema
exports.ValidateCouponInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "優惠碼不能為空"),
    orderAmount: zod_1.z.number().nonnegative(),
});
// 驗證優惠碼輸出 Schema
exports.ValidateCouponOutputSchema = zod_1.z.object({
    valid: zod_1.z.boolean(),
    error: zod_1.z.string().optional(),
    coupon: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        code: zod_1.z.string(),
        discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
        value: zod_1.z.number(),
        minSpend: zod_1.z.number(),
    }).optional(),
    discountAmount: zod_1.z.number().optional(),
});
// 查詢優惠券列表輸入 Schema
exports.GetCouponsInputSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// 查詢優惠券列表輸出 Schema
exports.GetCouponsOutputSchema = zod_1.z.object({
    coupons: zod_1.z.array(exports.CouponSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
// 建立優惠券輸入 Schema
exports.CreateCouponInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "優惠碼不能為空").max(50, "優惠碼長度不能超過 50 個字元"),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: zod_1.z.number().positive("折扣面額必須大於 0"),
    minSpend: zod_1.z.number().nonnegative("最低消費金額不能為負數").default(0),
    isActive: zod_1.z.boolean().default(true),
    expiresAt: zod_1.z.date().or(zod_1.z.string()).nullable().optional(),
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
exports.UpdateCouponInputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("不合法的優惠券 ID 格式"),
    code: zod_1.z.string().min(1).max(50).optional(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    value: zod_1.z.number().positive("折扣面額必須大於 0").optional(),
    minSpend: zod_1.z.number().nonnegative("最低消費金額不能為負數").optional(),
    isActive: zod_1.z.boolean().optional(),
    expiresAt: zod_1.z.date().or(zod_1.z.string()).nullable().optional(),
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
exports.GetOrdersInputSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
});
// 查詢歷史訂單輸出 Schema
exports.GetOrdersOutputSchema = zod_1.z.object({
    orders: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        totalAmount: zod_1.z.number(),
        status: zod_1.z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
        createdAt: zod_1.z.date().or(zod_1.z.string()),
    })),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
// 查詢單一訂單詳情輸出 Schema
exports.OrderDetailOutputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    totalAmount: zod_1.z.number(),
    discountAmount: zod_1.z.number().optional(),
    couponCode: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    shippingAddress: exports.AddressSchema,
    billingAddress: exports.AddressSchema,
    orderItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        productId: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        price: zod_1.z.number(),
        quantity: zod_1.z.number(),
    })),
    createdAt: zod_1.z.date().or(zod_1.z.string()),
    updatedAt: zod_1.z.date().or(zod_1.z.string()),
});
// 查詢分類清單輸出 Schema
exports.GetCategoriesOutputSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
}));
// 更新訂單狀態輸入 Schema
exports.UpdateOrderStatusInputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("不合法的訂單 ID 格式"),
    status: zod_1.z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});
