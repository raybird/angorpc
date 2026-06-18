import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrpcClientService, CartItem } from './orpc-client.js';
import { AuthStateService } from './auth-state.js';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  private orpc = inject(OrpcClientService);
  private auth = inject(AuthStateService);
  private platformId = inject(PLATFORM_ID);

  // Core Signals
  readonly cartItems = signal<CartItem[]>([]);
  readonly totalPrice = signal<number>(0);

  // Computed Signals
  readonly cartCount = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    // 監聽登入狀態改變
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        // 登入時載入購物車
        this.fetchCart();
      } else {
        // 登出時清空
        this.clearCart();
      }
    });
  }

  /**
   * 載入購物車內容
   */
  async fetchCart() {
    if (!this.isBrowser || !this.auth.isAuthenticated()) return;
    try {
      const res = await this.orpc.client.cart.getCart();
      this.cartItems.set(res.items);
      this.totalPrice.set(res.totalPrice);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }

  /**
   * 加入商品至購物車
   */
  async addItem(productId: string, quantity: number = 1) {
    if (!this.isBrowser) return;
    if (!this.auth.isAuthenticated()) {
      throw new Error('UNAUTHORIZED');
    }
    try {
      const res = await this.orpc.client.cart.addItem({ productId, quantity });
      this.cartItems.set(res.items);
      this.totalPrice.set(res.totalPrice);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      throw err;
    }
  }

  /**
   * 更新商品數量
   */
  async updateQuantity(productId: string, quantity: number) {
    if (!this.isBrowser) return;
    if (!this.auth.isAuthenticated()) return;
    try {
      const res = await this.orpc.client.cart.updateItem({ productId, quantity });
      this.cartItems.set(res.items);
      this.totalPrice.set(res.totalPrice);
    } catch (err) {
      console.error('Failed to update cart item quantity:', err);
      throw err;
    }
  }

  /**
   * 移除商品
   */
  async removeItem(productId: string) {
    if (!this.isBrowser) return;
    if (!this.auth.isAuthenticated()) return;
    try {
      const res = await this.orpc.client.cart.removeItem({ productId });
      this.cartItems.set(res.items);
      this.totalPrice.set(res.totalPrice);
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      throw err;
    }
  }

  /**
   * 清空本地狀態
   */
  clearCart() {
    this.cartItems.set([]);
    this.totalPrice.set(0);
  }
}
