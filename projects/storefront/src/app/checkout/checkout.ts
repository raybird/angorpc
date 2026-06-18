import { Component, inject, signal, OnInit } from '@angular/core';
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

      const res = await this.orpc.client.order.createOrder({
        shippingAddress: formVal.shippingAddress as any,
        billingAddress: formVal.billingAddress as any,
        items
      });

      await this.cartState.fetchCart();

      alert(`訂單下單成功！訂單編號：\n${res.orderId}`);
      this.router.navigate(['/orders']);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'INSUFFICIENT_STOCK') {
        alert('下單失敗：部分商品庫存不足，請修改購買數量！');
      } else {
        alert('建立訂單時發生未知錯誤，請稍後重試。');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
