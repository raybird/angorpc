import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import {
  CreateOrderInputSchema,
  CreateOrderOutputSchema,
  GetOrdersInputSchema,
  GetOrdersOutputSchema,
  OrderDetailOutputSchema,
  UpdateOrderStatusInputSchema,
  PayOrderInputSchema,
  PayOrderOutputSchema,
  CancelOrRefundOrderInputSchema,
  CancelOrRefundOrderOutputSchema
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
      const variantIds = input.items.map((i) => i.variantId).filter(Boolean) as string[];

      // 1. 查詢所有相關商品與變體資訊
      const [products, variants] = await Promise.all([
        tx.product.findMany({
          where: { id: { in: productIds } },
        }),
        variantIds.length > 0
          ? tx.productVariant.findMany({
              where: { id: { in: variantIds } },
            })
          : [],
      ]);

      const productMap = new Map(products.map((p) => [p.id, p]));
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 2. 預檢商品狀態與庫存
      let totalAmount = 0;
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product || !product.isActive) {
          throw new Error('PRODUCT_NOT_FOUND');
        }

        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (!variant || variant.productId !== item.productId) {
            throw new Error('PRODUCT_NOT_FOUND'); // 變體不存在或不屬於此商品
          }
          if (variant.stock < item.quantity) {
            throw new Error('INSUFFICIENT_STOCK');
          }
          totalAmount += Number(variant.price) * item.quantity;
        } else {
          if (product.stock < item.quantity) {
            throw new Error('INSUFFICIENT_STOCK');
          }
          totalAmount += Number(product.price) * item.quantity;
        }
      }

      // 2.1 驗證並計算優惠券折扣
      let discountAmount = 0;
      let couponId: string | undefined = undefined;

      if (input.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: input.couponCode },
        });

        if (!coupon || !coupon.isActive) {
          throw new Error('INVALID_COUPON');
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          throw new Error('COUPON_EXPIRED');
        }

        if (totalAmount < Number(coupon.minSpend)) {
          throw new Error('COUPON_MIN_SPEND_NOT_MET');
        }

        couponId = coupon.id;
        const value = Number(coupon.value);
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (value / 100);
        } else if (coupon.discountType === 'FIXED_AMOUNT') {
          discountAmount = value;
        }

        // 折扣上限為商品小計
        discountAmount = Math.min(discountAmount, totalAmount);
      }

      const finalAmount = totalAmount - discountAmount;

      // 3. 扣減庫存 (使用 gte 條件保障併發安全與樂觀鎖版本自增)
      for (const item of input.items) {
        try {
          if (item.variantId) {
            await tx.productVariant.update({
              where: {
                id: item.variantId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          } else {
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
          }
        } catch (err) {
          // 若更新失敗代表在此瞬間庫存已被他人取走
          throw new Error('INSUFFICIENT_STOCK');
        }
      }

      // 4. 建立訂單與明細
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount: finalAmount,
          discountAmount,
          couponId,
          status: 'PENDING',
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          orderItems: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!;
              if (item.variantId) {
                const variant = variantMap.get(item.variantId)!;
                return {
                  productId: item.productId,
                  variantId: item.variantId,
                  price: variant.price,
                  quantity: item.quantity,
                };
              } else {
                return {
                  productId: item.productId,
                  price: product.price,
                  quantity: item.quantity,
                };
              }
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
            variant: true,
          },
        },
        coupon: true,
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
      variantId: item.variantId,
      name: item.product.name,
      variantName: item.variant?.name || null,
      price: Number(item.price), // 當下快照價格
      quantity: item.quantity,
    }));

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      couponCode: order.coupon?.code || null,
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

async function refundOrderStock(tx: any, orderItems: any[]) {
  for (const item of orderItems) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } }
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          version: { increment: 1 }
        }
      });
    }
  }
}

export const updateOrderStatus = os
  .use(authMiddleware)
  .input(UpdateOrderStatusInputSchema)
  .output(OrderDetailOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateOrderStatusInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. 查詢現有訂單與明細
      const oldOrder = await tx.order.findUnique({
        where: { id: input.id },
        include: { orderItems: true }
      });

      if (!oldOrder) {
        throw new Error('ORDER_NOT_FOUND');
      }

      const oldStatus = oldOrder.status;
      const newStatus = input.status;

      if (oldStatus === newStatus) {
        return tx.order.findUniqueOrThrow({
          where: { id: input.id },
          include: {
            orderItems: {
              include: {
                product: true,
                variant: true,
              },
            },
            coupon: true,
          },
        });
      }

      // 防禦終態逆流
      if (oldStatus === 'CANCELLED' || oldStatus === 'REFUNDED') {
        throw new Error('ORDER_ALREADY_FINALIZED');
      }

      // 狀態機流轉安全防禦
      if (oldStatus === 'PENDING' && !['PAID', 'CANCELLED'].includes(newStatus)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }
      if (oldStatus === 'PAID' && !['SHIPPED', 'REFUNDED'].includes(newStatus)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }
      if (oldStatus === 'SHIPPED' && !['DELIVERED', 'REFUNDED'].includes(newStatus)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }
      if (oldStatus === 'DELIVERED' && newStatus !== 'REFUNDED') {
        throw new Error('INVALID_STATUS_TRANSITION');
      }

      // 若流轉到取消或退款，退還庫存
      if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') {
        await refundOrderStock(tx, oldOrder.orderItems);
      }

      // 2. 更新訂單狀態
      return tx.order.update({
        where: { id: input.id },
        data: { status: newStatus },
        include: {
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          coupon: true,
        },
      });
    });

    const shippingAddress = order.shippingAddress as any;
    const billingAddress = order.billingAddress as any;

    const formattedItems = order.orderItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      variantName: item.variant?.name || null,
      price: Number(item.price),
      quantity: item.quantity,
    }));

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      couponCode: order.coupon?.code || null,
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

/**
 * 支付訂單 (模擬金流整合)
 */
export const payOrder = os
  .use(authMiddleware)
  .input(PayOrderInputSchema)
  .output(PayOrderOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof PayOrderInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const { orderId, cardNumber, cardHolder, expiryDate, cvv } = input;

    // 1. 查詢訂單
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    // 2. 權限防禦：僅限訂單所有者本人支付
    if (order.userId !== context.user.id) {
      throw new Error('FORBIDDEN');
    }

    // 3. 狀態機防禦：僅能支付 PENDING 訂單
    if (order.status !== 'PENDING') {
      return {
        success: false,
        orderId: order.id,
        status: order.status,
        errorMessage: '此訂單已完成付款或已取消，無法重複付款。',
      };
    }

    // 4. 模擬金流規則校驗
    // 規則 A：過期的卡片 (expiryDate: MM/YY)
    const [monthStr, yearStr] = expiryDate.split('/');
    const month = parseInt(monthStr, 10);
    const year = 2000 + parseInt(yearStr, 10);
    const now = new Date();
    // 取得當月最後一天
    const expiry = new Date(year, month, 0, 23, 59, 59);
    if (expiry < now) {
      return {
        success: false,
        orderId: order.id,
        status: order.status,
        errorMessage: '卡片已過期 (CARD_EXPIRED)。',
      };
    }

    // 規則 B：安全碼為 999 模擬安全碼錯誤
    if (cvv === '999') {
      return {
        success: false,
        orderId: order.id,
        status: order.status,
        errorMessage: '安全碼錯誤 (INVALID_CVV)。',
      };
    }

    // 規則 C：卡號尾數為 2 模擬餘額不足
    if (cardNumber.endsWith('2')) {
      return {
        success: false,
        orderId: order.id,
        status: order.status,
        errorMessage: '餘額不足，請更換卡片重試 (INSUFFICIENT_FUNDS)。',
      };
    }

    // 5. 扣款成功，更新訂單狀態為 PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
      },
    });

    return {
      success: true,
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    };
  });

/**
 * 用戶自主取消（PENDING）或申請退款（PAID, SHIPPED, DELIVERED）
 */
export const cancelOrRefundOrder = os
  .use(authMiddleware)
  .input(CancelOrRefundOrderInputSchema)
  .output(CancelOrRefundOrderOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof CancelOrRefundOrderInputSchema>; context: AuthContext }) => {
    const user = context.user;
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    const { orderId } = input;

    const result = await prisma.$transaction(async (tx) => {
      // 1. 查詢訂單與明細
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (!order) {
        throw new Error('ORDER_NOT_FOUND');
      }

      // 權限校驗：僅限訂單所有者或管理員
      if (order.userId !== user.id && user.role !== 'ADMIN') {
        throw new Error('FORBIDDEN');
      }

      const currentStatus = order.status;
      let targetStatus: 'CANCELLED' | 'REFUNDED';

      if (currentStatus === 'PENDING') {
        targetStatus = 'CANCELLED';
      } else if (['PAID', 'SHIPPED', 'DELIVERED'].includes(currentStatus)) {
        targetStatus = 'REFUNDED';
      } else {
        throw new Error('ORDER_ALREADY_FINALIZED');
      }

      // 2. 退還庫存
      await refundOrderStock(tx, order.orderItems);

      // 3. 更新訂單狀態
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
      });

      return updated;
    });

    return {
      success: true,
      orderId: result.id,
      status: result.status,
    };
  });

export const orderRouter = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  payOrder,
  cancelOrRefundOrder,
};
export type OrderRouter = typeof orderRouter;
