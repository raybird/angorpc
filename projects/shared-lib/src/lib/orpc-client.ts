import { Injectable } from '@angular/core';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

export interface AppRouterClient {
  hello: (input: { name: string }) => Promise<{ message: string; timestamp: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class OrpcClientService {
  private link = new RPCLink({
    url: 'http://localhost:3000/api/rpc',
  });

  readonly client = createORPCClient<any>(this.link) as unknown as AppRouterClient;
}
