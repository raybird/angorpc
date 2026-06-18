import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import {
  CreateOrderInputSchema,
  CreateOrderOutputSchema,
  GetOrdersInputSchema,
  GetOrdersOutputSchema,
  OrderDetailOutputSchema
} from '../../shared/index.js';

/**
 * 建立新訂單 (結帳下單)
 */
export const createOrder = os
  .use(authMiddleware)
  .input(CreateOrderInputSchema)
  .output(CreateOrderOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof CreateOrderInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const userId = context.user.id;

    // 使用交易以保證扣庫存、建訂單與清購物車的原子性
    const result = await prisma.$transaction(async (tx) => {
      const productIds = input.items.map((i) => i.productId);

      // 1. 查詢所有相關商品資訊
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. 預檢商品狀態與庫存
      let totalAmount = 0;
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product || !product.isActive) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        if (product.stock < item.quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }
        totalAmount += Number(product.price) * item.quantity;
      }

      // 3. 扣減庫存 (使用 gte 條件保障併發安全與樂觀鎖版本自增)
      for (const item of input.items) {
        try {
          await tx.product.update({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
              version: { increment: 1 }, // 自增版本以利樂觀鎖防護
            },
          });
        } catch (err) {
          // 若更新失敗代表在此瞬間庫存已被他人取走
          throw new Error('INSUFFICIENT_STOCK');
        }
      }

      // 4. 建立訂單與明細
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          orderItems: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                price: product.price,
                quantity: item.quantity,
              };
            }),
          },
        },
      });

      // 5. 清除當前用戶的購物車明細
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return order;
    });

    return {
      orderId: result.id,
      totalAmount: Number(result.totalAmount),
      status: result.status,
      createdAt: result.createdAt,
    };
  });

/**
 * 查詢歷史訂單清單 (分頁)
 */
export const getOrders = os
  .use(authMiddleware)
  .input(GetOrdersInputSchema)
  .output(GetOrdersOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof GetOrdersInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const { page, limit, status } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    // 一般用戶僅能查看本人訂單，管理員可查看全平台
    if (context.user.role !== 'ADMIN') {
      where.userId = context.user.id;
    }
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt,
    }));

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

/**
 * 查詢特定訂單詳情
 */
export const getOrderById = os
  .use(authMiddleware)
  .input(z.object({ id: z.string().uuid() }))
  .output(OrderDetailOutputSchema)
  .handler(async ({ input, context }: { input: { id: string }; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const order = await prisma.order.findUnique({
      where: { id: input.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    // 權限校驗：本人或管理員方可讀取
    if (order.userId !== context.user.id && context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    // 格式轉換
    const shippingAddress = order.shippingAddress as any;
    const billingAddress = order.billingAddress as any;

    const formattedItems = order.orderItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: Number(item.price), // 當下快照價格
      quantity: item.quantity,
    }));

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddress: {
        recipientName: shippingAddress.recipientName || '',
        phone: shippingAddress.phone || '',
        address: shippingAddress.address || '',
        postalCode: shippingAddress.postalCode,
      },
      billingAddress: {
        recipientName: billingAddress.recipientName || '',
        phone: billingAddress.phone || '',
        address: billingAddress.address || '',
        postalCode: billingAddress.postalCode,
      },
      orderItems: formattedItems,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

export const orderRouter = {
  createOrder,
  getOrders,
  getOrderById,
};
export type OrderRouter = typeof orderRouter;
