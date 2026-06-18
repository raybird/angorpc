import { TestBed } from '@angular/core/testing';
import { CheckoutComponent } from './checkout';
import { provideRouter, Router } from '@angular/router';
import { CartStateService, AuthStateService, OrpcClientService } from 'shared-lib';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('CheckoutComponent', () => {
  let mockCartStateService: any;
  let mockAuthStateService: any;
  let mockOrpcClientService: any;
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
      fetchCart: vi.fn().mockResolvedValue({})
    };

    mockAuthStateService = {
      isAuthenticated: signal(true),
      currentUser: signal({ id: 'user-1', name: 'Raybird' })
    };

    mockOrpcClientService = {
      client: {
        coupon: {
          validateCoupon: vi.fn()
        },
        order: {
          createOrder: vi.fn()
        }
      }
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CartStateService, useValue: mockCartStateService },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: OrpcClientService, useValue: mockOrpcClientService },
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should compute initial amounts correctly', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    expect(component['subtotalAmount']()).toBe(2000);
    expect(component['discountAmount']()).toBe(0);
    expect(component['finalAmount']()).toBe(2000);
  });

  it('should apply discount coupon correctly (percentage)', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    mockOrpcClientService.client.coupon.validateCoupon.mockResolvedValue({
      valid: true,
      coupon: {
        id: 'coupon-1',
        code: 'SALE20',
        discountType: 'PERCENTAGE',
        value: 20,
        minSpend: 500
      },
      discountAmount: 400
    });

    component['couponCodeInput'].set('SALE20');
    await component.applyCoupon();

    expect(mockOrpcClientService.client.coupon.validateCoupon).toHaveBeenCalledWith({
      code: 'SALE20',
      orderAmount: 2000
    });
    expect(component['appliedCoupon']()).toEqual({
      id: 'coupon-1',
      code: 'SALE20',
      discountType: 'PERCENTAGE',
      value: 20,
      minSpend: 500
    });
    expect(component['discountAmount']()).toBe(400); // 2000 * 20%
    expect(component['finalAmount']()).toBe(1600);
    expect(component['couponSuccess']()).toBe('優惠券套用成功！');
    expect(component['couponError']()).toBe('');
  });

  it('should apply discount coupon correctly (fixed amount)', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    mockOrpcClientService.client.coupon.validateCoupon.mockResolvedValue({
      valid: true,
      coupon: {
        id: 'coupon-2',
        code: 'FREE100',
        discountType: 'FIXED_AMOUNT',
        value: 100,
        minSpend: 500
      },
      discountAmount: 100
    });

    component['couponCodeInput'].set('FREE100');
    await component.applyCoupon();

    expect(component['appliedCoupon']()).toBeTruthy();
    expect(component['discountAmount']()).toBe(100);
    expect(component['finalAmount']()).toBe(1900);
  });

  it('should limit discount amount to subtotal', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    // 小計設為 50 元
    mockCartStateService.totalPrice.set(50);

    mockOrpcClientService.client.coupon.validateCoupon.mockResolvedValue({
      valid: true,
      coupon: {
        id: 'coupon-3',
        code: 'SUPERFREE',
        discountType: 'FIXED_AMOUNT',
        value: 100,
        minSpend: 0
      },
      discountAmount: 100
    });

    component['couponCodeInput'].set('SUPERFREE');
    await component.applyCoupon();

    expect(component['discountAmount']()).toBe(50); // 上限為小計 50
    expect(component['finalAmount']()).toBe(0);
  });

  it('should show error when coupon validation fails', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    mockOrpcClientService.client.coupon.validateCoupon.mockResolvedValue({
      valid: false,
      error: '此優惠券已過期'
    });

    component['couponCodeInput'].set('EXPIRED');
    await component.applyCoupon();

    expect(component['appliedCoupon']()).toBeNull();
    expect(component['couponError']()).toBe('此優惠券已過期');
    expect(component['couponSuccess']()).toBe('');
  });

  it('should clean coupon state on removeCoupon', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    component['appliedCoupon'].set({ code: 'SALE20', discountType: 'PERCENTAGE', value: 20 });
    component['couponCodeInput'].set('SALE20');
    component['couponSuccess'].set('Success');

    component.removeCoupon();

    expect(component['appliedCoupon']()).toBeNull();
    expect(component['couponCodeInput']()).toBe('');
    expect(component['couponSuccess']()).toBe('');
    expect(component['couponError']()).toBe('');
  });

  it('should pass couponCode when submitting order', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    // 填寫必填欄位
    component['checkoutForm'].patchValue({
      shippingAddress: {
        recipientName: 'Raybird',
        phone: '0912345678',
        address: '台北市大安區新生南路'
      }
    });

    component['appliedCoupon'].set({ code: 'SALE20' });
    mockOrpcClientService.client.order.createOrder.mockResolvedValue({ orderId: 'ord-123' });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component.onSubmit();

    expect(mockOrpcClientService.client.order.createOrder).toHaveBeenCalledWith({
      shippingAddress: {
        recipientName: 'Raybird',
        phone: '0912345678',
        address: '台北市大安區新生南路',
        postalCode: ''
      },
      billingAddress: {
        recipientName: 'Raybird',
        phone: '0912345678',
        address: '台北市大安區新生南路',
        postalCode: ''
      },
      items: [
        { productId: 'prod-1', quantity: 2 }
      ],
      couponCode: 'SALE20'
    });
  });
});
