import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { OrpcClientService, AuthStateService, CartStateService } from 'shared-lib';
import { signal, computed } from '@angular/core';
import { vi } from 'vitest';

describe('App Component with Search & Filters', () => {
  let mockOrpcClientService: any;
  let mockAuthStateService: any;
  let mockCartStateService: any;

  beforeEach(async () => {
    // 建立 mock products
    const mockProducts = [
      { id: '1', name: 'Product A', slug: 'product-a', price: 100, categoryId: 'cat-1', stock: 10, isActive: true, createdAt: new Date() },
      { id: '2', name: 'Product B', slug: 'product-b', price: 200, categoryId: 'cat-2', stock: 5, isActive: true, createdAt: new Date() },
    ];

    const mockCategories = [
      { id: 'cat-1', name: 'Category A', slug: 'cat-a' },
      { id: 'cat-2', name: 'Category B', slug: 'cat-b' },
    ];

    // Mock OrpcClientService 的 client 結構
    mockOrpcClientService = {
      client: {
        product: {
          getProducts: vi.fn().mockResolvedValue({
            products: mockProducts,
            pagination: { page: 1, limit: 12, total: 2, totalPages: 1 }
          }),
          getCategories: vi.fn().mockResolvedValue(mockCategories),
        }
      }
    };

    // Mock AuthStateService
    mockAuthStateService = {
      currentUser: signal(null),
      isAuthenticated: computed(() => false),
    };

    // Mock CartStateService
    mockCartStateService = {
      cartCount: signal(0),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: OrpcClientService, useValue: mockOrpcClientService },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: CartStateService, useValue: mockCartStateService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should load categories and products on init', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    // 呼叫 ngOnInit 
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockOrpcClientService.client.product.getCategories).toHaveBeenCalled();
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalled();
    expect(app['products']().length).toBe(2);
    expect(app['categories']().length).toBe(2);
  });

  it('should filter by category when onSelectCategory is called', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    // 模擬選擇分類
    mockOrpcClientService.client.product.getProducts.mockClear();
    app['onSelectCategory']('cat-1');

    expect(app['selectedCategoryId']()).toBe('cat-1');
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'cat-1'
    }));
  });

  it('should debounce search queries', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    mockOrpcClientService.client.product.getProducts.mockClear();

    // 模擬打字
    app['onSearchInput']({ target: { value: 'Angular' } } as any);
    app['onSearchInput']({ target: { value: 'Angular 22' } } as any);

    // 等待 150ms，此時應該還沒有呼叫 API (因為 debounceTime 是 300ms)
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockOrpcClientService.client.product.getProducts).not.toHaveBeenCalled();

    // 再等待 250ms (累計 400ms)，此時應該已經呼叫 API，且只呼叫了一次，值為最後一個 "Angular 22"
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledOnce();
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      search: 'Angular 22'
    }));
  });

  it('should filter by price range', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    mockOrpcClientService.client.product.getProducts.mockClear();

    // 模擬價格改變
    app['onPriceChange']('min', { target: { value: '100' } } as any);
    app['onPriceChange']('max', { target: { value: '500' } } as any);

    expect(app['minPrice']()).toBe(100);
    expect(app['maxPrice']()).toBe(500);
    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      minPrice: 100,
      maxPrice: 500
    }));
  });

  it('should clear all filters when onClearFilters is called', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    // 先設定一些過濾條件
    app['selectedCategoryId'].set('cat-1');
    app['searchQuery'].set('test');
    app['minPrice'].set(50);
    app['maxPrice'].set(150);

    mockOrpcClientService.client.product.getProducts.mockClear();

    // 清除過濾
    app['onClearFilters']();

    expect(app['selectedCategoryId']()).toBeNull();
    expect(app['searchQuery']()).toBe('');
    expect(app['minPrice']()).toBeNull();
    expect(app['maxPrice']()).toBeNull();

    expect(mockOrpcClientService.client.product.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: undefined,
      search: undefined,
      minPrice: undefined,
      maxPrice: undefined
    }));
  });
});
