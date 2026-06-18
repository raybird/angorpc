import { TestBed } from '@angular/core/testing';
import { CouponsComponent } from './coupons';
import { OrpcClientService } from 'shared-lib';
import { vi } from 'vitest';

describe('CouponsComponent', () => {
  let mockOrpcClientService: any;

  beforeEach(async () => {
    mockOrpcClientService = {
      client: {
        coupon: {
          getCoupons: vi.fn(),
          createCoupon: vi.fn(),
          updateCoupon: vi.fn()
        }
      }
    };

    // 預設模擬 API 回傳
    mockOrpcClientService.client.coupon.getCoupons.mockResolvedValue({
      coupons: [
        {
          id: 'coupon-1',
          code: 'SUMMER2026',
          discountType: 'PERCENTAGE',
          value: 20,
          minSpend: 500,
          isActive: true,
          expiresAt: '2026-12-31T00:00:00.000Z',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    });

    await TestBed.configureTestingModule({
      imports: [CouponsComponent],
      providers: [
        { provide: OrpcClientService, useValue: mockOrpcClientService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load coupons on init', async () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();
    await fixture.whenStable();

    expect(mockOrpcClientService.client.coupon.getCoupons).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      isActive: undefined
    });
    expect(component['coupons']().length).toBe(1);
    expect(component['coupons']()[0].code).toBe('SUMMER2026');
  });

  it('should trigger search and status filtering', async () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    component.onSearch({ target: { value: 'SUMMER' } } as any);
    expect(component['searchQuery']()).toBe('SUMMER');
    expect(component['page']()).toBe(1);

    component.onStatusChange({ target: { value: 'ACTIVE' } } as any);
    expect(component['selectedStatus']()).toBe('ACTIVE');
    expect(component['page']()).toBe(1);
  });

  it('should toggle active status of a coupon', async () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    mockOrpcClientService.client.coupon.updateCoupon.mockResolvedValue({
      id: 'coupon-1',
      isActive: false
    });

    component['coupons'].set([
      { id: 'coupon-1', code: 'SUMMER2026', isActive: true }
    ]);

    await component.toggleActive({ id: 'coupon-1', isActive: true });

    expect(mockOrpcClientService.client.coupon.updateCoupon).toHaveBeenCalledWith({
      id: 'coupon-1',
      isActive: false
    });
    expect(component['coupons']()[0].isActive).toBe(false);
  });

  it('should open modal for creation and reset form', () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    component.openCreateModal();

    expect(component['editingCoupon']()).toBeNull();
    expect(component['isModalOpen']()).toBe(true);
    expect(component['couponForm'].value.code).toBe('');
    expect(component['couponForm'].value.discountType).toBe('PERCENTAGE');
  });

  it('should open modal for editing and patch form values', () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    const mockCoupon = {
      id: 'coupon-1',
      code: 'WINTER2026',
      discountType: 'FIXED_AMOUNT',
      value: 150,
      minSpend: 1000,
      isActive: true,
      expiresAt: '2026-12-31T00:00:00.000Z'
    };

    component.openEditModal(mockCoupon);

    expect(component['editingCoupon']()).toEqual(mockCoupon);
    expect(component['isModalOpen']()).toBe(true);
    expect(component['couponForm'].value.code).toBe('WINTER2026');
    expect(component['couponForm'].value.value).toBe(150);
    expect(component['couponForm'].value.expiresAt).toBe('2026-12-31');
  });

  it('should validate percentage value is not greater than 100', () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    component.openCreateModal();
    component['couponForm'].patchValue({
      code: 'SUPER99',
      discountType: 'PERCENTAGE',
      value: 120, // 不合法的百分比面額
      minSpend: 0
    });

    // 觸發 value 驗證更新
    const valueControl = component['couponForm'].get('value');
    expect(valueControl?.invalid).toBe(true);
  });

  it('should call createCoupon when submitting a new coupon', async () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    component.openCreateModal();
    component['couponForm'].patchValue({
      code: 'NEWBIE',
      discountType: 'FIXED_AMOUNT',
      value: 100,
      minSpend: 500,
      isActive: true,
      expiresAt: '2026-08-31'
    });

    mockOrpcClientService.client.coupon.createCoupon.mockResolvedValue({});

    await component.onSaveCoupon();

    expect(mockOrpcClientService.client.coupon.createCoupon).toHaveBeenCalledWith({
      code: 'NEWBIE',
      discountType: 'FIXED_AMOUNT',
      value: 100,
      minSpend: 500,
      isActive: true,
      expiresAt: new Date('2026-08-31').toISOString()
    });
    expect(component['isModalOpen']()).toBe(false);
  });

  it('should call updateCoupon when submitting an edited coupon', async () => {
    const fixture = TestBed.createComponent(CouponsComponent);
    const component = fixture.componentInstance;

    const mockCoupon = {
      id: 'coupon-1',
      code: 'SUMMER2026',
      discountType: 'PERCENTAGE',
      value: 20,
      minSpend: 500,
      isActive: true,
      expiresAt: null
    };

    component.openEditModal(mockCoupon);
    // 修改到期日
    component['couponForm'].patchValue({
      expiresAt: '2026-09-30'
    });

    mockOrpcClientService.client.coupon.updateCoupon.mockResolvedValue({});

    await component.onSaveCoupon();

    expect(mockOrpcClientService.client.coupon.updateCoupon).toHaveBeenCalledWith({
      id: 'coupon-1',
      code: 'SUMMER2026',
      discountType: 'PERCENTAGE',
      value: 20,
      minSpend: 500,
      isActive: true,
      expiresAt: new Date('2026-09-30').toISOString()
    });
    expect(component['isModalOpen']()).toBe(false);
  });
});
