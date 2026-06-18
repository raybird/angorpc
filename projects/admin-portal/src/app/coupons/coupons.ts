import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrpcClientService } from 'shared-lib';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coupons.html',
  styleUrl: './coupons.scss'
})
export class CouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orpc = inject(OrpcClientService);

  // 訊號狀態管理
  protected readonly coupons = signal<any[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedStatus = signal<string>('ALL'); // ALL, ACTIVE, INACTIVE
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly isLoading = signal(true);
  protected readonly isModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly editingCoupon = signal<any | null>(null);
  protected readonly errorMessage = signal('');

  protected readonly couponForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/), Validators.minLength(3)]],
    discountType: ['PERCENTAGE', [Validators.required]],
    value: [0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    minSpend: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
    expiresAt: ['']
  });

  ngOnInit() {
    this.loadCoupons();

    // 自動轉大寫的貼心設計
    this.couponForm.get('code')?.valueChanges.subscribe(val => {
      if (val) {
        const upper = val.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        this.couponForm.get('code')?.patchValue(upper, { emitEvent: false });
      }
    });

    // 動態變更金額面額驗證限制
    this.couponForm.get('discountType')?.valueChanges.subscribe(type => {
      const valueControl = this.couponForm.get('value');
      if (type === 'PERCENTAGE') {
        valueControl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
      } else {
        valueControl?.setValidators([Validators.required, Validators.min(0.01)]);
      }
      valueControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  async loadCoupons() {
    this.isLoading.set(true);
    try {
      let activeFilter: boolean | undefined = undefined;
      if (this.selectedStatus() === 'ACTIVE') activeFilter = true;
      if (this.selectedStatus() === 'INACTIVE') activeFilter = false;

      const res = await this.orpc.client.coupon.getCoupons({
        page: this.page(),
        limit: 10,
        search: this.searchQuery() || undefined,
        isActive: activeFilter
      });
      this.coupons.set(res.coupons);
      this.totalPages.set(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadCoupons();
  }

  onStatusChange(event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(status);
    this.page.set(1);
    this.loadCoupons();
  }

  changePage(offset: number) {
    const targetPage = this.page() + offset;
    if (targetPage >= 1 && targetPage <= this.totalPages()) {
      this.page.set(targetPage);
      this.loadCoupons();
    }
  }

  async toggleActive(coupon: any) {
    try {
      const updated = await this.orpc.client.coupon.updateCoupon({
        id: coupon.id,
        isActive: !coupon.isActive
      });

      // 樂觀即時更新本地清單，優化使用者體驗
      this.coupons.update(list =>
        list.map(c => c.id === coupon.id ? { ...c, isActive: updated.isActive } : c)
      );
    } catch (err: any) {
      console.error('Failed to toggle active state:', err);
      alert('切換優惠券啟用狀態失敗，請稍後重試。');
    }
  }

  openCreateModal() {
    this.editingCoupon.set(null);
    this.errorMessage.set('');
    this.couponForm.reset({
      code: '',
      discountType: 'PERCENTAGE',
      value: 0,
      minSpend: 0,
      isActive: true,
      expiresAt: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(coupon: any) {
    this.editingCoupon.set(coupon);
    this.errorMessage.set('');

    let dateStr = '';
    if (coupon.expiresAt) {
      const d = new Date(coupon.expiresAt);
      // 轉換成 YYYY-MM-DD
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${d.getFullYear()}-${month}-${day}`;
    }

    this.couponForm.patchValue({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      minSpend: coupon.minSpend,
      isActive: coupon.isActive,
      expiresAt: dateStr
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingCoupon.set(null);
  }

  async onSaveCoupon() {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.couponForm.value;
      const payload: any = {
        code: formValue.code!,
        discountType: formValue.discountType!,
        value: Number(formValue.value),
        minSpend: Number(formValue.minSpend),
        isActive: formValue.isActive!,
        expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : null
      };

      if (this.editingCoupon()) {
        await this.orpc.client.coupon.updateCoupon({
          id: this.editingCoupon().id,
          ...payload
        });
      } else {
        await this.orpc.client.coupon.createCoupon(payload);
      }

      this.closeModal();
      this.loadCoupons();
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      if (err.message === 'COUPON_CODE_ALREADY_EXISTS') {
        this.errorMessage.set('此優惠碼已存在，請使用其他代碼');
      } else {
        this.errorMessage.set(err.message || '儲存優惠券時發生錯誤');
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
