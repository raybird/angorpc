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
