import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  protected readonly isLoading = signal(true);

  // 模擬後台營運動態數據
  protected readonly totalSales = signal(158430);
  protected readonly ordersCount = signal(642);
  protected readonly productsCount = signal(54);
  protected readonly customersCount = signal(218);

  // 模擬近期訂單
  protected readonly recentOrders = signal([
    { id: 'ord-8832', customer: 'Raybird', amount: 2000, status: 'PAID', date: '2026-06-19' },
    { id: 'ord-8831', customer: '林小明', amount: 1580, status: 'PENDING', date: '2026-06-18' },
    { id: 'ord-8830', customer: '陳大同', amount: 3200, status: 'SHIPPED', date: '2026-06-18' },
    { id: 'ord-8829', customer: '張三', amount: 650, status: 'DELIVERED', date: '2026-06-17' },
    { id: 'ord-8828', customer: '李四', amount: 1200, status: 'CANCELLED', date: '2026-06-17' }
  ]);

  ngOnInit() {
    // 模擬網路延遲，提供 premium 骨架屏載入動效
    setTimeout(() => {
      this.isLoading.set(false);
    }, 600);
  }
}
