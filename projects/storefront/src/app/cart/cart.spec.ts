import { TestBed } from '@angular/core/testing';
import { CartComponent } from './cart';
import { provideRouter, Router } from '@angular/router';
import { CartStateService, AuthStateService } from 'shared-lib';
import { signal, computed } from '@angular/core';
import { vi } from 'vitest';

describe('CartComponent', () => {
  let mockCartStateService: any;
  let mockAuthStateService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockCartStateService = {
      cartItems: signal([
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 2,
          product: {
            id: 'prod-1',
            name: 'Mechanical Keyboard',
            price: 1000,
            stock: 10
          }
        }
      ]),
      totalPrice: signal(2000),
      cartCount: signal(2),
      updateQuantity: vi.fn().mockResolvedValue({}),
      removeItem: vi.fn().mockResolvedValue({})
    };

    mockAuthStateService = {
      isAuthenticated: signal(true),
      currentUser: signal({ id: 'user-1', name: 'Raybird' })
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CartStateService, useValue: mockCartStateService },
        { provide: AuthStateService, useValue: mockAuthStateService },
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should call updateQuantity when increasing quantity', async () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;

    await component.onUpdateQuantity('prod-1', 2, 1);

    expect(mockCartStateService.updateQuantity).toHaveBeenCalledWith('prod-1', 3);
  });

  it('should call removeItem when decreasing quantity to 0', async () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;

    const removeItemSpy = vi.spyOn(component, 'onRemoveItem').mockResolvedValue();

    await component.onUpdateQuantity('prod-1', 1, -1);

    expect(removeItemSpy).toHaveBeenCalledWith('prod-1');
  });

  it('should call removeItem on cartState when confirm is accepted', async () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;

    // Mock global confirm dialog to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await component.onRemoveItem('prod-1');

    expect(confirmSpy).toHaveBeenCalledWith('確定要將此商品從購物車中移除嗎？');
    expect(mockCartStateService.removeItem).toHaveBeenCalledWith('prod-1');

    confirmSpy.mockRestore();
  });

  it('should not call removeItem on cartState when confirm is rejected', async () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await component.onRemoveItem('prod-1');

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockCartStateService.removeItem).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should navigate to checkout when onCheckout is called', () => {
    const fixture = TestBed.createComponent(CartComponent);
    const component = fixture.componentInstance;

    component.onCheckout();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
