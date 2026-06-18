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
