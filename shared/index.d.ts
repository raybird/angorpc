import { z } from 'zod';
export declare const HelloInputSchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const HelloOutputSchema: z.ZodObject<{
    message: z.ZodString;
    timestamp: z.ZodString;
}, z.core.$strip>;
export declare const LoginInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const LoginOutputSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<{
            USER: "USER";
            ADMIN: "ADMIN";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RegisterInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RegisterOutputSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<{
            USER: "USER";
            ADMIN: "ADMIN";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ProfileOutputSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
    }>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, z.core.$strip>;
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    categoryId: z.ZodString;
    stock: z.ZodNumber;
    isActive: z.ZodBoolean;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, z.core.$strip>;
export declare const GetProductsInputSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    includeInactive: z.ZodDefault<z.ZodBoolean>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const GetProductsOutputSchema: z.ZodObject<{
    products: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        price: z.ZodNumber;
        categoryId: z.ZodString;
        stock: z.ZodNumber;
        isActive: z.ZodBoolean;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, z.core.$strip>>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ProductDetailOutputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    stock: z.ZodNumber;
    version: z.ZodNumber;
    isActive: z.ZodBoolean;
    categoryId: z.ZodString;
    category: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
    }, z.core.$strip>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, z.core.$strip>;
export declare const CreateProductInputSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    categoryId: z.ZodString;
    stock: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateProductInputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    stock: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CartItemSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    product: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        price: z.ZodNumber;
        categoryId: z.ZodString;
        stock: z.ZodNumber;
        isActive: z.ZodBoolean;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const AddCartItemInputSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const UpdateCartItemInputSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
}, z.core.$strip>;
export declare const RemoveCartItemInputSchema: z.ZodObject<{
    productId: z.ZodString;
}, z.core.$strip>;
export declare const GetCartOutputSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        productId: z.ZodString;
        quantity: z.ZodNumber;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
        updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
        product: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            slug: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            price: z.ZodNumber;
            categoryId: z.ZodString;
            stock: z.ZodNumber;
            isActive: z.ZodBoolean;
            createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    totalPrice: z.ZodNumber;
}, z.core.$strip>;
export declare const AddressSchema: z.ZodObject<{
    recipientName: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    postalCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateOrderInputSchema: z.ZodObject<{
    shippingAddress: z.ZodObject<{
        recipientName: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        postalCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    billingAddress: z.ZodObject<{
        recipientName: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        postalCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    couponCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateOrderOutputSchema: z.ZodObject<{
    orderId: z.ZodString;
    totalAmount: z.ZodNumber;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        PAID: "PAID";
        SHIPPED: "SHIPPED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
    }>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, z.core.$strip>;
export declare const CouponSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    discountType: z.ZodEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
    }>;
    value: z.ZodNumber;
    minSpend: z.ZodNumber;
    isActive: z.ZodBoolean;
    expiresAt: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, z.core.$strip>;
export declare const ValidateCouponInputSchema: z.ZodObject<{
    code: z.ZodString;
    orderAmount: z.ZodNumber;
}, z.core.$strip>;
export declare const ValidateCouponOutputSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    coupon: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        discountType: z.ZodEnum<{
            PERCENTAGE: "PERCENTAGE";
            FIXED_AMOUNT: "FIXED_AMOUNT";
        }>;
        value: z.ZodNumber;
        minSpend: z.ZodNumber;
    }, z.core.$strip>>;
    discountAmount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const GetCouponsInputSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const GetCouponsOutputSchema: z.ZodObject<{
    coupons: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        discountType: z.ZodEnum<{
            PERCENTAGE: "PERCENTAGE";
            FIXED_AMOUNT: "FIXED_AMOUNT";
        }>;
        value: z.ZodNumber;
        minSpend: z.ZodNumber;
        isActive: z.ZodBoolean;
        expiresAt: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    }, z.core.$strip>>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateCouponInputSchema: z.ZodObject<{
    code: z.ZodString;
    discountType: z.ZodEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
    }>;
    value: z.ZodNumber;
    minSpend: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    expiresAt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
}, z.core.$strip>;
export declare const UpdateCouponInputSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    discountType: z.ZodOptional<z.ZodEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
    }>>;
    value: z.ZodOptional<z.ZodNumber>;
    minSpend: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    expiresAt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
}, z.core.$strip>;
export declare const GetOrdersInputSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        PAID: "PAID";
        SHIPPED: "SHIPPED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
    }>>;
}, z.core.$strip>;
export declare const GetOrdersOutputSchema: z.ZodObject<{
    orders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        totalAmount: z.ZodNumber;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            PAID: "PAID";
            SHIPPED: "SHIPPED";
            DELIVERED: "DELIVERED";
            CANCELLED: "CANCELLED";
            REFUNDED: "REFUNDED";
        }>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, z.core.$strip>>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const OrderDetailOutputSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    totalAmount: z.ZodNumber;
    discountAmount: z.ZodOptional<z.ZodNumber>;
    couponCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        PAID: "PAID";
        SHIPPED: "SHIPPED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
    }>;
    shippingAddress: z.ZodObject<{
        recipientName: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        postalCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    billingAddress: z.ZodObject<{
        recipientName: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        postalCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    orderItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, z.core.$strip>;
export declare const GetCategoriesOutputSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
}, z.core.$strip>>;
