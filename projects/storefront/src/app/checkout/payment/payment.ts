import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrpcClientService, OrderDetail } from 'shared-lib';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss'
})
export class PaymentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orpc = inject(OrpcClientService);

  protected readonly orderId = signal<string>('');
  protected readonly orderDetail = signal<OrderDetail | null>(null);
  protected readonly isLoadingOrder = signal(true);

  // 付款狀態
  protected readonly isSubmitting = signal(false);
  protected readonly paymentSuccess = signal(false);
  protected readonly errorMessage = signal('');

  // 信用卡翻轉與格式化狀態
  protected readonly isCardFlipped = signal(false);

  protected readonly paymentForm = this.fb.group({
    cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{16}$/)]],
    cardHolder: ['', [Validators.required, Validators.minLength(1)]],
    expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3}$/)]]
  });

  protected get f() { return this.paymentForm.controls; }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['orderId'];
      if (id) {
        this.orderId.set(id);
        this.loadOrder(id);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  async loadOrder(id: string) {
    this.isLoadingOrder.set(true);
    this.errorMessage.set('');
    try {
      const order = await this.orpc.client.order.getOrderById({ id });
      if (order.status !== 'PENDING') {
        this.router.navigate(['/orders']);
        return;
      }
      this.orderDetail.set(order);
    } catch (err) {
      console.error(err);
      this.errorMessage.set('載入訂單失敗或無權讀取此訂單');
    } finally {
      this.isLoadingOrder.set(false);
    }
  }

  getFormattedCardNumber(): string {
    const val = this.paymentForm.get('cardNumber')?.value || '';
    const clean = val.replace(/\s+/g, '');
    const matches = clean.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return val;
    }
  }

  onCardNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 16);
  }

  onExpiryInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let clean = input.value.replace(/[^0-9]/g, '');
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2, 4);
    }
    input.value = clean.slice(0, 5);
  }

  onCvvInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 3);
  }

  async onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.paymentSuccess.set(false);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const formVal = this.paymentForm.value;
      const res = await this.orpc.client.order.payOrder({
        orderId: this.orderId(),
        cardNumber: formVal.cardNumber!,
        cardHolder: formVal.cardHolder!,
        expiryDate: formVal.expiryDate!,
        cvv: formVal.cvv!
      });

      if (res.success) {
        this.paymentSuccess.set(true);
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 3000);
      } else {
        this.errorMessage.set(res.errorMessage || '付款失敗，請確認信用卡資訊。');
      }
    } catch (err: any) {
      console.error(err);
      this.errorMessage.set(err.message || '金流伺服器連線失敗，請稍後重試。');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
