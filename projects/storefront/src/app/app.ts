import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrpcClientService, AuthStateService, Product, CartStateService } from 'shared-lib';

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
  private cartState = inject(CartStateService);

  // Sync member session with storefront landing page
  protected readonly currentUser = this.authState.currentUser;
  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly cartCount = this.cartState.cartCount;

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

  protected async onAddToCart(productId: string) {
    if (!this.isAuthenticated()) {
      alert('請先登入會員以使用購物車！');
      return;
    }
    try {
      await this.cartState.addItem(productId, 1);
      alert('商品已成功加入購物車！');
    } catch (err) {
      alert('加入購物車失敗，可能已超出商品庫存上限！');
    }
  }

  protected handleLogout() {
    this.authState.logout();
  }
}

