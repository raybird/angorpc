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

  // 已選規格屬性，例如 {"Color": "Blue", "Size": "L"}
  protected readonly selectedAttributes = signal<{ [key: string]: string }>({});

  // 登入狀態對齊
  protected readonly isAuthenticated = this.authState.isAuthenticated;

  // 整理商品變體規格的所有維度與其所有不重複的值
  protected readonly availableSpecs = computed(() => {
    const prod = this.product();
    if (!prod || !prod.variants || prod.variants.length === 0) {
      return [];
    }
    const specsMap: { [key: string]: Set<string> } = {};
    prod.variants.forEach((v: any) => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach((key) => {
          if (!specsMap[key]) {
            specsMap[key] = new Set<string>();
          }
          specsMap[key].add(v.attributes[key]);
        });
      }
    });
    return Object.keys(specsMap).map((key) => ({
      key,
      values: Array.from(specsMap[key])
    }));
  });

  // 目前匹配到的商品變體
  protected readonly currentVariant = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();
    if (!prod || !prod.variants || prod.variants.length === 0) {
      return null;
    }
    const specKeys = this.availableSpecs().map((s) => s.key);
    const isAllSelected = specKeys.every((k) => selected[k] !== undefined);
    if (!isAllSelected) {
      return null;
    }
    return (
      prod.variants.find((v: any) => {
        return specKeys.every((k) => v.attributes[k] === selected[k]);
      }) || null
    );
  });

  // 動態顯示單價
  protected readonly displayedPrice = computed(() => {
    const prod = this.product();
    const variant = this.currentVariant();
    if (variant) {
      return variant.price;
    }
    return prod ? prod.price : 0;
  });

  // 動態顯示庫存
  protected readonly displayedStock = computed(() => {
    const prod = this.product();
    const variant = this.currentVariant();
    if (variant) {
      return variant.stock;
    }
    return prod ? prod.stock : 0;
  });

  // 計算小計金額
  protected readonly subtotal = computed(() => {
    return this.displayedPrice() * this.quantity();
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
      this.selectedAttributes.set({}); // 重置規格選擇
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 選擇規格選項
   */
  protected selectAttribute(key: string, value: string) {
    this.selectedAttributes.update((current) => ({
      ...current,
      [key]: value,
    }));
    this.quantity.set(1); // 每次切換規格，數量重設為 1
  }

  /**
   * 購買數量增加 (最高不能超過當前顯示庫存)
   */
  protected onIncreaseQty() {
    const maxStock = this.displayedStock();
    if (this.quantity() < maxStock) {
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

    // 檢查變體是否已選齊
    const hasVariants = prod.variants && prod.variants.length > 0;
    const variant = this.currentVariant();
    if (hasVariants && !variant) {
      alert('請選擇完整的商品規格選項！');
      return;
    }

    const maxStock = this.displayedStock();
    if (maxStock <= 0) {
      alert('該規格商品已無庫存，無法加入購物車！');
      return;
    }

    this.isAddingToCart.set(true);
    try {
      await this.cartState.addItem(prod.id, this.quantity(), variant?.id || null);
      alert(`已成功將 ${this.quantity()} 件「${prod.name}${variant ? ' (' + variant.name + ')' : ''}」加入購物車！`);
      this.quantity.set(1); // 成功後重設為 1
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      alert('加入購物車失敗，可能已超出商品庫存上限！');
    } finally {
      this.isAddingToCart.set(false);
    }
  }
}
