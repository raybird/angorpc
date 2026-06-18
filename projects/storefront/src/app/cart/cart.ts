import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartStateService, AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent {
  protected readonly cartState = inject(CartStateService);
  protected readonly authState = inject(AuthStateService);
  private router = inject(Router);

  protected readonly isUpdating = signal<string | null>(null);

  async onUpdateQuantity(productId: string, currentQty: number, change: number) {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      await this.onRemoveItem(productId);
      return;
    }

    this.isUpdating.set(productId);
    try {
      await this.cartState.updateQuantity(productId, newQty);
    } catch (err) {
      alert('更新商品數量失敗，可能已超出庫存上限！');
    } finally {
      this.isUpdating.set(null);
    }
  }

  async onRemoveItem(productId: string) {
    if (confirm('確定要將此商品從購物車中移除嗎？')) {
      this.isUpdating.set(productId);
      try {
        await this.cartState.removeItem(productId);
      } catch (err) {
        alert('移除商品失敗！');
      } finally {
        this.isUpdating.set(null);
      }
    }
  }

  onCheckout() {
    this.router.navigate(['/checkout']);
  }
}
