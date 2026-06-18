import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrpcClientService } from 'shared-lib';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class OrdersComponent implements OnInit {
  private orpc = inject(OrpcClientService);

  // 訊號狀態管理
  protected readonly orders = signal<any[]>([]);
  protected readonly selectedStatus = signal<string>('ALL');
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly isLoading = signal(true);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedOrder = signal<any | null>(null);
  protected readonly isUpdating = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isLoadingDetail = signal(false);

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading.set(true);
    try {
      const statusFilter = this.selectedStatus() === 'ALL' ? undefined : this.selectedStatus();
      const res = await this.orpc.client.order.getOrders({
        page: this.page(),
        limit: 10,
        status: statusFilter as any
      });
      this.orders.set(res.orders);
      this.totalPages.set(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onStatusFilterChange(event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(status);
    this.page.set(1);
    this.loadOrders();
  }

  changePage(offset: number) {
    const targetPage = this.page() + offset;
    if (targetPage >= 1 && targetPage <= this.totalPages()) {
      this.page.set(targetPage);
      this.loadOrders();
    }
  }

  async viewOrderDetail(order: any) {
    this.isModalOpen.set(true);
    this.isLoadingDetail.set(true);
    this.selectedOrder.set(null);
    this.errorMessage.set('');

    try {
      const detail = await this.orpc.client.order.getOrderById({ id: order.id });
      this.selectedOrder.set(detail);
    } catch (err: any) {
      console.error('Failed to get order details:', err);
      this.errorMessage.set(err.message || '無法取得訂單明細資訊。');
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedOrder.set(null);
  }

  async onUpdateStatus(event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    if (!this.selectedOrder() || !newStatus) return;

    this.isUpdating.set(true);
    this.errorMessage.set('');

    try {
      const updated = await this.orpc.client.order.updateOrderStatus({
        id: this.selectedOrder().id,
        status: newStatus as any
      });

      // 更新詳細檢視的狀態
      this.selectedOrder.set(updated);

      // 即時更新本地列表的訂單狀態，優化互動流暢度
      this.orders.update(list =>
        list.map(o => o.id === updated.id ? { ...o, status: updated.status } : o)
      );
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      this.errorMessage.set(err.message || '更新訂單狀態失敗，請稍後重試。');
    } finally {
      this.isUpdating.set(false);
    }
  }

  // 取得對應狀態的中文標籤與樣式 class
  getStatusLabel(status: string): { label: string; class: string } {
    switch (status) {
      case 'PENDING':
        return { label: '待付款', class: 'status-pending' };
      case 'PAID':
        return { label: '已付款', class: 'status-paid' };
      case 'SHIPPED':
        return { label: '已出貨', class: 'status-shipped' };
      case 'DELIVERED':
        return { label: '已送達', class: 'status-delivered' };
      case 'CANCELLED':
        return { label: '已取消', class: 'status-cancelled' };
      case 'REFUNDED':
        return { label: '已退款', class: 'status-refunded' };
      default:
        return { label: status, class: '' };
    }
  }
}
