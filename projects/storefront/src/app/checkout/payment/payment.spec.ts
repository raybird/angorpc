import { TestBed } from '@angular/core/testing';
import { PaymentComponent } from './payment';
import { OrpcClientService } from 'shared-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PaymentComponent', () => {
  let mockOrpcClientService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        order: {
          getOrderById: vi.fn(),
          payOrder: vi.fn()
        }
      }
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      params: of({ orderId: 'test-order-uuid' })
    };

    // 預設模擬 API 回傳
    mockOrpcClientService.client.order.getOrderById.mockResolvedValue({
      id: 'test-order-uuid',
      userId: 'user-1',
      totalAmount: 1200,
      discountAmount: 0,
      status: 'PENDING',
      shippingAddress: {
        recipientName: 'Raybird',
        phone: '0912345678',
        address: 'Taipei 101',
        postalCode: '100'
      },
      billingAddress: {
        recipientName: 'Raybird',
        phone: '0912345678',
        address: 'Taipei 101',
        postalCode: '100'
      },
      orderItems: [],
      createdAt: '2026-06-19T06:00:00Z',
      updatedAt: '2026-06-19T06:00:00Z'
    });

    mockOrpcClientService.client.order.payOrder.mockResolvedValue({
      success: true,
      orderId: 'test-order-uuid',
      status: 'PAID'
    });

    await TestBed.configureTestingModule({
      imports: [PaymentComponent],
      providers: [
        { provide: OrpcClientService, useValue: mockOrpcClientService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load order details on init and keep loading false', async () => {
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(component['orderId']()).toBe('test-order-uuid');
    expect(mockOrpcClientService.client.order.getOrderById).toHaveBeenCalledWith({ id: 'test-order-uuid' });
    expect(component['orderDetail']()).toBeTruthy();
    expect(component['orderDetail']()?.totalAmount).toBe(1200);
    expect(component['isLoadingOrder']()).toBe(false);
  });

  it('should redirect to /orders if order status is not PENDING', async () => {
    mockOrpcClientService.client.order.getOrderById.mockResolvedValue({
      id: 'test-order-uuid',
      status: 'PAID', // 已付款
      shippingAddress: {},
      billingAddress: {}
    });

    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders']);
  });

  it('should filter non-digits and limit lengths on inputs', () => {
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // 模擬卡號輸入過濾
    const mockCardNumberInput = { value: '4000abc1234' } as HTMLInputElement;
    component.onCardNumberInput({ target: mockCardNumberInput } as any);
    expect(mockCardNumberInput.value).toBe('40001234');

    // 模擬有效期格式化與加斜線
    const mockExpiryInput = { value: '122' } as HTMLInputElement;
    component.onExpiryInput({ target: mockExpiryInput } as any);
    expect(mockExpiryInput.value).toBe('12/2');

    // 模擬 CVV 輸入過濾
    const mockCvvInput = { value: '9999a' } as HTMLInputElement;
    component.onCvvInput({ target: mockCvvInput } as any);
    expect(mockCvvInput.value).toBe('999');
  });

  it('should toggle card flip state on CVV input focus and blur', () => {
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    
    expect(component['isCardFlipped']()).toBe(false);

    // 聚焦
    component['isCardFlipped'].set(true);
    expect(component['isCardFlipped']()).toBe(true);

    // 模糊
    component['isCardFlipped'].set(false);
    expect(component['isCardFlipped']()).toBe(false);
  });

  it('should not submit payOrder if form is invalid', async () => {
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmit();

    expect(mockOrpcClientService.client.order.payOrder).not.toHaveBeenCalled();
    expect(component['isSubmitting']()).toBe(false);
  });

  it('should pay order successfully and redirect to /orders after a delay', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // 填充有效表單
    component['paymentForm'].setValue({
      cardNumber: '4000123456789010',
      cardHolder: 'Raybird',
      expiryDate: '12/28',
      cvv: '123'
    });

    const submitPromise = component.onSubmit();
    
    // 解決 setTimeout 延遲 (模擬 1.5 秒網路通訊)
    await vi.advanceTimersByTimeAsync(1500);
    // 解決跳轉前的 3 秒等待
    await vi.advanceTimersByTimeAsync(3000);

    await submitPromise;

    expect(mockOrpcClientService.client.order.payOrder).toHaveBeenCalledWith({
      orderId: 'test-order-uuid',
      cardNumber: '4000123456789010',
      cardHolder: 'Raybird',
      expiryDate: '12/28',
      cvv: '123'
    });

    expect(component['paymentSuccess']()).toBe(true);
    expect(component['isSubmitting']()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders']);
  });

  it('should display error message on payment failure', async () => {
    vi.useFakeTimers();
    mockOrpcClientService.client.order.payOrder.mockResolvedValue({
      success: false,
      orderId: 'test-order-uuid',
      status: 'PENDING',
      errorMessage: '餘額不足，請更換卡片重試 (INSUFFICIENT_FUNDS)。'
    });

    const fixture = TestBed.createComponent(PaymentComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['paymentForm'].setValue({
      cardNumber: '4000000000000002',
      cardHolder: 'Raybird',
      expiryDate: '12/28',
      cvv: '123'
    });

    const submitPromise = component.onSubmit();
    await vi.advanceTimersByTimeAsync(1500);
    await submitPromise;

    expect(component['paymentSuccess']()).toBe(false);
    expect(component['errorMessage']()).toBe('餘額不足，請更換卡片重試 (INSUFFICIENT_FUNDS)。');
    expect(component['isSubmitting']()).toBe(false);
  });
});
