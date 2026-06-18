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

export interface AppRouterClient {
  hello: (input: { name: string }) => Promise<{ message: string; timestamp: string }>;
  user: {
    register: (input: any) => Promise<{ token: string; user: User }>;
    login: (input: any) => Promise<{ token: string; user: User }>;
    getProfile: () => Promise<User & { createdAt: string | Date }>;
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
