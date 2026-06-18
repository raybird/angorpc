import { TestBed } from '@angular/core/testing';
import { OrdersComponent } from './orders';
import { OrpcClientService } from 'shared-lib';
import { vi } from 'vitest';

describe('OrdersComponent', () => {
  let mockOrpcClientService: any;

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        order: {
          getOrders: vi.fn(),
          getOrderById: vi.fn(),
          updateOrderStatus: vi.fn()
        }
      }
    };

    // 預設模擬 API 回傳
    mockOrpcClientService.client.order.getOrders.mockResolvedValue({
      orders: [
        {
          id: 'order-1',
          userId: 'user-1',
          totalAmount: 1200,
          status: 'PENDING',
          createdAt: '2026-06-19T05:30:00.000Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    });

    mockOrpcClientService.client.order.getOrderById.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      totalAmount: 1200,
      discountAmount: 0,
      couponCode: null,
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
      orderItems: [
        {
          id: 'item-1',
          productId: 'prod-1',
          name: 'Mechanical Keyboard',
          price: 1200,
          quantity: 1
        }
      ],
      createdAt: '2026-06-19T05:30:00.000Z',
      updatedAt: '2026-06-19T05:30:00.000Z'
    });

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        { provide: OrpcClientService, useValue: mockOrpcClientService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(OrdersComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load orders on init', async () => {
    const fixture = TestBed.createComponent(OrdersComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(mockOrpcClientService.client.order.getOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: undefined
    });
    expect(component['orders']().length).toBe(1);
    expect(component['orders']()[0].id).toBe('order-1');
  });

  it('should trigger status filter changes', async () => {
    const fixture = TestBed.createComponent(OrdersComponent);
    const component = fixture.componentInstance;

    component.onStatusFilterChange({ target: { value: 'PAID' } } as any);
    expect(component['selectedStatus']()).toBe('PAID');
    expect(component['page']()).toBe(1);
  });

  it('should open modal and load order details', async () => {
    const fixture = TestBed.createComponent(OrdersComponent);
    const component = fixture.componentInstance;

    await component.viewOrderDetail({ id: 'order-1' });

    expect(component['isModalOpen']()).toBe(true);
    expect(mockOrpcClientService.client.order.getOrderById).toHaveBeenCalledWith({ id: 'order-1' });
    expect(component['selectedOrder']()).toBeTruthy();
    expect(component['selectedOrder']().shippingAddress.recipientName).toBe('Raybird');
  });

  it('should update order status and reflect in list', async () => {
    const fixture = TestBed.createComponent(OrdersComponent);
    const component = fixture.componentInstance;

    // 先設定 mock
    mockOrpcClientService.client.order.updateOrderStatus.mockResolvedValue({
      id: 'order-1',
      status: 'SHIPPED',
      shippingAddress: { recipientName: 'Raybird', phone: '0912345678', address: 'Taipei 101', postalCode: '100' },
      billingAddress: { recipientName: 'Raybird', phone: '0912345678', address: 'Taipei 101', postalCode: '100' },
      orderItems: [],
      totalAmount: 1200,
      discountAmount: 0
    });

    component['orders'].set([
      { id: 'order-1', status: 'PENDING' }
    ]);
    component['selectedOrder'].set({
      id: 'order-1',
      status: 'PENDING'
    });

    await component.onUpdateStatus({ target: { value: 'SHIPPED' } } as any);

    expect(mockOrpcClientService.client.order.updateOrderStatus).toHaveBeenCalledWith({
      id: 'order-1',
      status: 'SHIPPED'
    });
    expect(component['selectedOrder']().status).toBe('SHIPPED');
    expect(component['orders']()[0].status).toBe('SHIPPED');
  });
});
