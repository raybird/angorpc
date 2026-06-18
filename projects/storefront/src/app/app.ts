import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrpcClientService } from 'shared-lib';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('AngoRPC Storefront');
  protected readonly welcomeMessage = signal<string>('正在連接 oRPC API 伺服器...');
  protected readonly timestamp = signal<string>('');
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorOccurred = signal<boolean>(false);

  private orpc = inject(OrpcClientService);

  async ngOnInit() {
    await this.fetchHello();
  }

  async fetchHello() {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const response = await this.orpc.client.hello({ name: 'Raybird' });
      this.welcomeMessage.set(response.message);
      this.timestamp.set(response.timestamp);
    } catch (err) {
      console.error('oRPC API Error:', err);
      this.welcomeMessage.set('無法連線至後端 oRPC 伺服器，請確認 Node.js API 伺服器是否已在埠號 3000 啟動。');
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
