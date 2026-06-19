import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import { GetDashboardStatsOutputSchema } from '../../shared/index.js';

export const getDashboardStats = os
  .use(authMiddleware)
  .output(GetDashboardStatsOutputSchema)
  .handler(async ({ context }: { context: AuthContext }) => {
    // 限制管理員才能存取營運動態
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    // 1. 累計銷售額 (已付款、已出貨、已送達狀態)
    const salesAggregation = await prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
      },
      _sum: {
        totalAmount: true
      }
    });
    const totalSales = salesAggregation._sum.totalAmount ? Number(salesAggregation._sum.totalAmount) : 0;

    // 2. 累計訂單數 (非已取消訂單)
    const ordersCount = await prisma.order.count({
      where: {
        status: { not: 'CANCELLED' }
      }
    });

    // 3. 上架商品數
    const productsCount = await prisma.product.count({
      where: {
        isActive: true
      }
    });

    // 4. 客戶總數 (一般用戶)
    const customersCount = await prisma.user.count({
      where: {
        role: 'USER'
      }
    });

    // 5. 最近 5 筆訂單明細
    const recent = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      }
    });
    const recentOrders = recent.map(o => ({
      id: o.id,
      customerName: o.user ? `${o.user.lastName || ''}${o.user.firstName || ''}` || o.user.email : '未知用戶',
      totalAmount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt
    }));

    // 6. 最近 7 天的每日銷售金額
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const ordersLast7Days = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // 初始化最近 7 天的日期與金額對照 (以本地日期為基準避免時區錯位)
    const salesMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      salesMap.set(dateStr, 0);
    }

    // 統計數據分組
    for (const o of ordersLast7Days) {
      const dateStr = o.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      if (salesMap.has(dateStr)) {
        salesMap.set(dateStr, salesMap.get(dateStr)! + Number(o.totalAmount));
      }
    }

    const salesHistory = Array.from(salesMap.entries()).map(([date, amount]) => ({
      date,
      amount
    }));

    // 7. 分類銷售佔比
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
        }
      },
      select: {
        price: true,
        quantity: true,
        product: {
          select: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const categoryMap = new Map<string, number>();
    for (const item of items) {
      const catName = item.product?.category?.name || '其他分類';
      const total = Number(item.price) * item.quantity;
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + total);
    }

    const categorySales = Array.from(categoryMap.entries()).map(([categoryName, amount]) => ({
      categoryName,
      amount
    }));

    return {
      totalSales,
      ordersCount,
      productsCount,
      customersCount,
      recentOrders,
      salesHistory,
      categorySales
    };
  });

export const reportRouter = {
  getDashboardStats,
};
export type ReportRouter = typeof reportRouter;
