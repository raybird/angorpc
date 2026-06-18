import { TestBed } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { OrpcClientService, AuthStateService, CartStateService } from 'shared-lib';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('ProductDetailComponent', () => {
  let mockOrpcClientService: any;
  let mockAuthStateService: any;
  let mockCartStateService: any;
  let mockRouter: any;

  const mockProduct = {
    id: 'prod-123',
    name: 'Premium Keyboard',
    slug: 'premium-keyboard',
    price: 1500,
    stock: 5,
    description: 'High-end mechanical keyboard',
    category: {
      id: 'cat-1',
      name: 'Keyboards',
      slug: 'keyboards'
    }
  };

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        product: {
          getProductById: vi.fn().mockResolvedValue(mockProduct)
        }
      }
    };

    mockAuthStateService = {
      currentUser: signal(null),
      isAuthenticated: signal(false),
    };

    mockCartStateService = {
      addItem: vi.fn().mockResolvedValue({ items: [], totalPrice: 0 })
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ slug: 'premium-keyboard' })
          }
        },
        { provide: Router, useValue: mockRouter },
        { provide: OrpcClientService, useValue: mockOrpcClientService },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: CartStateService, useValue: mockCartStateService },
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load product detail on init', async () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockOrpcClientService.client.product.getProductById).toHaveBeenCalledWith({ slug: 'premium-keyboard' });
    expect(component['product']()).toEqual(mockProduct);
    expect(component['isLoading']()).toBe(false);
    expect(component['errorOccurred']()).toBe(false);
  });

  it('should handle quantity increase and decrease boundaries', async () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['quantity']()).toBe(1);

    // 增加數量
    component['onIncreaseQty']();
    expect(component['quantity']()).toBe(2);

    // 連續增加至上限 (stock = 5)
    component['onIncreaseQty']();
    component['onIncreaseQty']();
    component['onIncreaseQty']();
    expect(component['quantity']()).toBe(5);

    // 再增加應該維持在 5 (上限)
    component['onIncreaseQty']();
    expect(component['quantity']()).toBe(5);

    // 減少數量
    component['onDecreaseQty']();
    expect(component['quantity']()).toBe(4);

    // 減少至 1
    component['onDecreaseQty']();
    component['onDecreaseQty']();
    component['onDecreaseQty']();
    expect(component['quantity']()).toBe(1);

    // 再減少應該維持在 1 (下限)
    component['onDecreaseQty']();
    expect(component['quantity']()).toBe(1);
  });

  it('should redirect to login if unauthenticated when adding to cart', async () => {
    // 確保未登入
    mockAuthStateService.isAuthenticated.set(false);

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await fixture.whenStable();
    fixture.detectChanges();

    // 模擬彈窗 alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component['onAddToCart']();

    expect(alertSpy).toHaveBeenCalledWith('請先登入會員以使用購物車！');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockCartStateService.addItem).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('should call cartState.addItem when authenticated', async () => {
    // 模擬已登入
    mockAuthStateService.isAuthenticated.set(true);

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await fixture.whenStable();
    fixture.detectChanges();

    // 設定購買數量為 3
    component['quantity'].set(3);

    // 模擬彈窗 alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component['onAddToCart']();

    expect(mockCartStateService.addItem).toHaveBeenCalledWith('prod-123', 3);
    expect(alertSpy).toHaveBeenCalledWith('已成功將 3 件「Premium Keyboard」加入購物車！');
    expect(component['quantity']()).toBe(1); // 成功後數量重設為 1

    alertSpy.mockRestore();
  });

  it('should not add to cart if product is out of stock', async () => {
    // 模擬已登入
    mockAuthStateService.isAuthenticated.set(true);
    // 模擬商品售罄
    mockProduct.stock = 0;
    mockOrpcClientService.client.product.getProductById.mockResolvedValue(mockProduct);

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await fixture.whenStable();
    fixture.detectChanges();

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component['onAddToCart']();

    expect(alertSpy).toHaveBeenCalledWith('該商品已無庫存，無法加入購物車！');
    expect(mockCartStateService.addItem).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
