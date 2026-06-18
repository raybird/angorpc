import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrpcClientService, AuthStateService, Product, CartStateService, Category } from 'shared-lib';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

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
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorOccurred = signal<boolean>(false);

  // 篩選與搜尋狀態 Signals
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly searchQuery = signal<string>('');
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);

  // RxJS Search Subject 用於搜尋防抖 (Debounce)
  private searchSubject = new Subject<string>();

  private orpc = inject(OrpcClientService);
  private authState = inject(AuthStateService);
  private cartState = inject(CartStateService);
  private router = inject(Router);

  // 路由狀態追蹤
  protected readonly currentUrl = signal<string>('/');
  protected readonly isHomePage = computed(() => {
    const url = this.currentUrl().split('?')[0];
    return url === '/' || url === '/home';
  });

  // Sync member session with storefront landing page
  protected readonly currentUser = this.authState.currentUser;
  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly cartCount = this.cartState.cartCount;

  constructor() {
    // 監聽路由結束事件以更新 currentUrl 狀態
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });
  }

  async ngOnInit() {
    // 訂閱搜尋防抖邏輯
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.fetchProducts();
    });

    // 初始化時並行查詢商品與商品分類
    await Promise.all([
      this.fetchProducts(),
      this.fetchCategories()
    ]);
  }

  async fetchProducts() {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const categoryId = this.selectedCategoryId() || undefined;
      const search = this.searchQuery() || undefined;
      const minPrice = this.minPrice() !== null ? Number(this.minPrice()) : undefined;
      const maxPrice = this.maxPrice() !== null ? Number(this.maxPrice()) : undefined;

      const response = await this.orpc.client.product.getProducts({
        page: 1,
        limit: 12,
        categoryId,
        search,
        minPrice,
        maxPrice
      });
      this.products.set(response.products);
    } catch (err) {
      console.error('oRPC Fetch Products Error:', err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  async fetchCategories() {
    try {
      const list = await this.orpc.client.product.getCategories();
      this.categories.set(list);
    } catch (err) {
      console.error('oRPC Fetch Categories Error:', err);
    }
  }

  protected onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  protected onSelectCategory(categoryId: string | null) {
    this.selectedCategoryId.set(categoryId);
    this.fetchProducts();
  }

  protected onPriceChange(field: 'min' | 'max', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const price = value ? Number(value) : null;
    if (field === 'min') {
      this.minPrice.set(price);
    } else {
      this.maxPrice.set(price);
    }
    this.fetchProducts();
  }

  protected onClearFilters() {
    this.selectedCategoryId.set(null);
    this.searchQuery.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.fetchProducts();
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


