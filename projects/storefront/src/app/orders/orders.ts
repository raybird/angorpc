import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrpcClientService, AuthStateService, Order, OrderDetail } from 'shared-lib';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class OrdersComponent implements OnInit {
  protected readonly authState = inject(AuthStateService);
  private orpc = inject(OrpcClientService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorOccurred = signal(false);

  private detailsCache = new Map<string, OrderDetail>();
  protected readonly activeOrderDetail = signal<OrderDetail | null>(null);
  protected readonly selectedOrderId = signal<string | null>(null);
  protected readonly isDetailLoading = signal(false);

  ngOnInit() {
    if (this.authState.isAuthenticated()) {
      this.fetchOrders();
    }
  }

  async fetchOrders() {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const res = await this.orpc.client.order.getOrders({ page: 1, limit: 20 });
      this.orders.set(res.orders);
    } catch (err) {
      console.error(err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleOrderDetail(orderId: string) {
    if (this.selectedOrderId() === orderId) {
      this.selectedOrderId.set(null);
      this.activeOrderDetail.set(null);
      return;
    }

    this.selectedOrderId.set(orderId);
    this.activeOrderDetail.set(null);

    if (this.detailsCache.has(orderId)) {
      this.activeOrderDetail.set(this.detailsCache.get(orderId)!);
      return;
    }

    this.isDetailLoading.set(true);
    try {
      const detail = await this.orpc.client.order.getOrderById({ id: orderId });
      this.detailsCache.set(orderId, detail);
      if (this.selectedOrderId() === orderId) {
        this.activeOrderDetail.set(detail);
      }
    } catch (err) {
      console.error(err);
      alert('無法取得訂單詳情！');
      this.selectedOrderId.set(null);
    } finally {
      this.isDetailLoading.set(false);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PAID': return 'status-paid';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      case 'REFUNDED': return 'status-refunded';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return '待付款';
      case 'PAID': return '已付款';
      case 'SHIPPED': return '已出貨';
      case 'DELIVERED': return '已送達';
      case 'CANCELLED': return '已取消';
      case 'REFUNDED': return '已退款';
      default: return status;
    }
  }
}
