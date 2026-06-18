import { Injectable } from '@angular/core';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  categoryId: string;
  stock: number;
  isActive: boolean;
  createdAt: string | Date;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  product: Product;
}

export interface Address {
  recipientName: string;
  phone: string;
  address: string;
  postalCode?: string;
}

export interface Order {
  id: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string | Date;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDetail {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  shippingAddress: Address;
  billingAddress: Address;
  orderItems: OrderItemDetail[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minSpend: number;
  isActive: boolean;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AppRouterClient {
  hello: (input: { name: string }) => Promise<{ message: string; timestamp: string }>;
  user: {
    register: (input: any) => Promise<{ token: string; user: User }>;
    login: (input: any) => Promise<{ token: string; user: User }>;
    getProfile: () => Promise<User & { createdAt: string | Date }>;
  };
  product: {
    getProducts: (input: {
      page?: number;
      limit?: number;
      categoryId?: string;
      search?: string;
      includeInactive?: boolean;
      minPrice?: number;
      maxPrice?: number;
    }) => Promise<{
      products: Product[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>;
    getProductById: (input: {
      id?: string;
      slug?: string;
    }) => Promise<Product & {
      version: number;
      category: {
        id: string;
        name: string;
        slug: string;
      };
      updatedAt: string | Date;
    }>;
    getCategories: () => Promise<Category[]>;
    createProduct: (input: {
      name: string;
      slug: string;
      description?: string;
      price: number;
      categoryId: string;
      stock: number;
      isActive?: boolean;
    }) => Promise<Product & {
      version: number;
      category: {
        id: string;
        name: string;
        slug: string;
      };
      updatedAt: string | Date;
    }>;
    updateProduct: (input: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      stock?: number;
      isActive?: boolean;
    }) => Promise<Product & {
      version: number;
      category: {
        id: string;
        name: string;
        slug: string;
      };
      updatedAt: string | Date;
    }>;
  };
  cart: {
    getCart: () => Promise<{ items: CartItem[]; totalPrice: number }>;
    addItem: (input: { productId: string; quantity?: number }) => Promise<{ items: CartItem[]; totalPrice: number }>;
    updateItem: (input: { productId: string; quantity: number }) => Promise<{ items: CartItem[]; totalPrice: number }>;
    removeItem: (input: { productId: string }) => Promise<{ items: CartItem[]; totalPrice: number }>;
  };
  order: {
    createOrder: (input: {
      shippingAddress: Address;
      billingAddress: Address;
      items: { productId: string; quantity: number }[];
      couponCode?: string;
    }) => Promise<{
      orderId: string;
      totalAmount: number;
      status: string;
      createdAt: string | Date;
    }>;
    getOrders: (input: {
      page?: number;
      limit?: number;
      status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    }) => Promise<{
      orders: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>;
    getOrderById: (input: { id: string }) => Promise<OrderDetail>;
  };
  coupon: {
    validateCoupon: (input: {
      code: string;
      orderAmount: number;
    }) => Promise<{
      valid: boolean;
      error?: string;
      coupon?: Omit<Coupon, 'isActive' | 'expiresAt' | 'createdAt' | 'updatedAt'>;
      discountAmount?: number;
    }>;
    getCoupons: (input: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    }) => Promise<{
      coupons: Coupon[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>;
    createCoupon: (input: {
      code: string;
      discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value: number;
      minSpend?: number;
      isActive?: boolean;
      expiresAt?: string | Date | null;
    }) => Promise<Coupon>;
    updateCoupon: (input: {
      id: string;
      code?: string;
      discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value?: number;
      minSpend?: number;
      isActive?: boolean;
      expiresAt?: string | Date | null;
    }) => Promise<Coupon>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrpcClientService {
  private link = new RPCLink({
    url: 'http://localhost:3000/api/rpc',
    headers: () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        return token ? { authorization: `Bearer ${token}` } : {};
      }
      return {};
    }
  });

  readonly client = createORPCClient<any>(this.link) as unknown as AppRouterClient;
}
