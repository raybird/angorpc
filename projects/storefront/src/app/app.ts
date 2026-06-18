import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrpcClientService, AuthStateService, Product } from 'shared-lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('AngoRPC Storefront');
  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorOccurred = signal<boolean>(false);

  private orpc = inject(OrpcClientService);
  private authState = inject(AuthStateService);

  // Sync member session with storefront landing page
  protected readonly currentUser = this.authState.currentUser;
  protected readonly isAuthenticated = this.authState.isAuthenticated;

  async ngOnInit() {
    await this.fetchProducts();
  }

  async fetchProducts() {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const response = await this.orpc.client.product.getProducts({
        page: 1,
        limit: 12
      });
      this.products.set(response.products);
    } catch (err) {
      console.error('oRPC Fetch Products Error:', err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected handleLogout() {
    this.authState.logout();
  }
}
