import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStateService, OrpcClientService, AuthStateService } from 'shared-lib';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected readonly cartState = inject(CartStateService);
  protected readonly authState = inject(AuthStateService);
  private orpc = inject(OrpcClientService);

  protected readonly isLoading = signal(false);
  protected readonly isSameAddress = signal(true);

  // 優惠券相關 Signals
  protected readonly couponCodeInput = signal('');
  protected readonly appliedCoupon = signal<any | null>(null);
  protected readonly couponError = signal('');
  protected readonly couponSuccess = signal('');
  protected readonly isApplyingCoupon = signal(false);

  protected readonly subtotalAmount = computed(() => this.cartState.totalPrice());

  protected readonly discountAmount = computed(() => {
    const coupon = this.appliedCoupon();
    if (!coupon) return 0;

    const subtotal = this.subtotalAmount();
    let discount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
      discount = subtotal * (coupon.value / 100);
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.value;
    }

    return Math.min(discount, subtotal);
  });

  protected readonly finalAmount = computed(() => {
    return this.subtotalAmount() - this.discountAmount();
  });

  protected readonly checkoutForm = this.fb.group({
    shippingAddress: this.fb.group({
      recipientName: ['', [Validators.required, Validators.minLength(1)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      postalCode: ['']
    }),
    billingAddress: this.fb.group({
      recipientName: ['', [Validators.required, Validators.minLength(1)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      postalCode: ['']
    })
  });

  ngOnInit() {
    if (this.authState.isAuthenticated() && this.cartState.cartItems().length === 0) {
      this.router.navigate(['/']);
    }

    this.checkoutForm.get('shippingAddress')?.valueChanges.subscribe(() => {
      if (this.isSameAddress()) {
        this.syncAddresses();
      }
    });
  }

  toggleSameAddress() {
    this.isSameAddress.update(val => !val);
    if (this.isSameAddress()) {
      this.syncAddresses();
    }
  }

  private syncAddresses() {
    const shipping = this.checkoutForm.get('shippingAddress')?.value;
    this.checkoutForm.get('billingAddress')?.patchValue({
      recipientName: shipping?.recipientName || '',
      phone: shipping?.phone || '',
      address: shipping?.address || '',
      postalCode: shipping?.postalCode || ''
    }, { emitEvent: false });
  }

  async applyCoupon() {
    const code = this.couponCodeInput().trim();
    if (!code) {
      this.couponError.set('請輸入優惠碼');
      this.couponSuccess.set('');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set('');
    this.couponSuccess.set('');

    try {
      const res = await this.orpc.client.coupon.validateCoupon({
        code,
        orderAmount: this.subtotalAmount()
      });

      if (res.valid) {
        this.appliedCoupon.set(res.coupon);
        this.couponSuccess.set('優惠券套用成功！');
        this.couponError.set('');
      } else {
        this.appliedCoupon.set(null);
        this.couponError.set(res.error || '無法套用此優惠券');
        this.couponSuccess.set('');
      }
    } catch (err: any) {
      console.error(err);
      this.appliedCoupon.set(null);
      this.couponError.set('驗證優惠券時發生錯誤');
      this.couponSuccess.set('');
    } finally {
      this.isApplyingCoupon.set(false);
    }
  }

  removeCoupon() {
    this.appliedCoupon.set(null);
    this.couponCodeInput.set('');
    this.couponSuccess.set('');
    this.couponError.set('');
  }

  async onSubmit() {
    if (this.isSameAddress()) {
      this.syncAddresses();
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const formVal = this.checkoutForm.value;
      const items = this.cartState.cartItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const coupon = this.appliedCoupon();
      const res = await this.orpc.client.order.createOrder({
        shippingAddress: formVal.shippingAddress as any,
        billingAddress: formVal.billingAddress as any,
        items,
        couponCode: coupon ? coupon.code : undefined
      });

      await this.cartState.fetchCart();
      this.removeCoupon();

      this.router.navigate(['/checkout/payment', res.orderId]);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'INSUFFICIENT_STOCK') {
        alert('下單失敗：部分商品庫存不足，請修改購買數量！');
      } else if (err.message === 'INVALID_COUPON') {
        alert('下單失敗：優惠券無效，請重新檢查！');
      } else if (err.message === 'COUPON_EXPIRED') {
        alert('下單失敗：優惠券已過期！');
      } else if (err.message === 'COUPON_MIN_SPEND_NOT_MET') {
        alert('下單失敗：未達優惠券最低消費門檻！');
      } else {
        alert('建立訂單時發生未知錯誤，請稍後重試。');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
