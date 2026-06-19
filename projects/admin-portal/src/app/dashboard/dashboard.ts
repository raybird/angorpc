import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrpcClientService, DashboardStats } from 'shared-lib';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private orpc = inject(OrpcClientService);
  protected readonly isLoading = signal(true);
  protected readonly errorOccurred = signal(false);

  // 營運指標 Signals
  protected readonly totalSales = signal(0);
  protected readonly ordersCount = signal(0);
  protected readonly productsCount = signal(0);
  protected readonly customersCount = signal(0);

  // 近期訂單
  protected readonly recentOrders = signal<DashboardStats['recentOrders']>([]);

  private salesChartInstance: Chart | null = null;
  private categoryChartInstance: Chart | null = null;

  async ngOnInit() {
    await this.fetchDashboardStats();
  }

  async fetchDashboardStats() {
    this.isLoading.set(true);
    this.errorOccurred.set(false);
    try {
      const stats = await this.orpc.client.report.getDashboardStats();
      
      this.totalSales.set(stats.totalSales);
      this.ordersCount.set(stats.ordersCount);
      this.productsCount.set(stats.productsCount);
      this.customersCount.set(stats.customersCount);
      this.recentOrders.set(stats.recentOrders);

      // DOM 載入後初始化圖表
      setTimeout(() => {
        this.initCharts(stats);
      }, 0);
      
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      this.errorOccurred.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  initCharts(stats: DashboardStats) {
    // 銷毀舊圖表以避免重複繪製的錯誤
    this.salesChartInstance?.destroy();
    this.categoryChartInstance?.destroy();

    // 1. 銷售趨勢折線圖 (Line Chart)
    const salesCtx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (salesCtx) {
      this.salesChartInstance = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: stats.salesHistory.map(h => h.date),
          datasets: [{
            label: '每日銷售總額 (NT$)',
            data: stats.salesHistory.map(h => h.amount),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#9ca3af',
                font: { family: 'Outfit, Inter, sans-serif' }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' }
            }
          }
        }
      });
    }

    // 2. 商品分類佔比圓餅圖 (Doughnut Chart)
    const categoryCtx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (categoryCtx) {
      const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      
      this.categoryChartInstance = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: stats.categorySales.map(c => c.categoryName),
          datasets: [{
            data: stats.categorySales.map(c => c.amount),
            backgroundColor: stats.categorySales.map((_, i) => colors[i % colors.length]),
            borderWidth: 1,
            borderColor: 'rgba(22, 28, 41, 0.8)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#9ca3af',
                font: { family: 'Outfit, Inter, sans-serif' }
              }
            }
          }
        }
      });
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
