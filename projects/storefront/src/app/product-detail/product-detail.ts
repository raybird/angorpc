import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrpcClientService, AuthStateService, CartStateService, Product } from 'shared-lib';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orpc = inject(OrpcClientService);
  private authState = inject(AuthStateService);
  private cartState = inject(CartStateService);

  // 元件狀態 Signals
  protected readonly product = signal<any | null>(null);
  protected readonly quantity = signal<number>(1);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorOccurred = signal<boolean>(false);
  protected readonly isAddingToCart = signal<boolean>(false);

  // 登入狀態對齊
  protected readonly isAuthenticated = this.authState.isAuthenticated;

  // 計算小計金額
  protected readonly subtotal = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    return prod.price * this.quantity();
  });

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      const slug = params['slug'];
      if (slug) {
        await this.fetchProductDetail(slug);
      } else {
        this.errorOccurred.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * 藉由 slug 呼叫 oRPC 載入商品詳情
   */
  async fetchProductDetail(slug: string) {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const detail = await this.orpc.client.product.getProductById({ slug });
      this.product.set(detail);
      this.quantity.set(1); // 重置數量為 1
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 購買數量增加 (最高不能超過商品庫存)
   */
  protected onIncreaseQty() {
    const prod = this.product();
    if (!prod) return;
    if (this.quantity() < prod.stock) {
      this.quantity.update(q => q + 1);
    }
  }

  /**
   * 購買數量減少 (最低為 1)
   */
  protected onDecreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  /**
   * 加入購物車
   */
  protected async onAddToCart() {
    const prod = this.product();
    if (!prod) return;

    if (!this.isAuthenticated()) {
      alert('請先登入會員以使用購物車！');
      this.router.navigate(['/login']);
      return;
    }

    if (prod.stock <= 0) {
      alert('該商品已無庫存，無法加入購物車！');
      return;
    }

    this.isAddingToCart.set(true);
    try {
      await this.cartState.addItem(prod.id, this.quantity());
      alert(`已成功將 ${this.quantity()} 件「${prod.name}」加入購物車！`);
      this.quantity.set(1); // 成功後重設為 1
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      alert('加入購物車失敗，可能已超出商品庫存上限！');
    } finally {
      this.isAddingToCart.set(false);
    }
  }
}
