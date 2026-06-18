import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import {
  AddCartItemInputSchema,
  UpdateCartItemInputSchema,
  RemoveCartItemInputSchema,
  GetCartOutputSchema
} from '../../shared/index.js';

/**
 * 查詢用戶購物車輔助函式
 */
async function getCartHelper(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const formattedItems = items.map((item) => ({
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: {
      ...item.product,
      price: Number(item.product.price),
    },
  }));

  const totalPrice = formattedItems.reduce((sum, item) => {
    return sum + item.quantity * item.product.price;
  }, 0);

  return {
    items: formattedItems,
    totalPrice,
  };
}

/**
 * 獲取當前登入用戶的購物車內容
 */
export const getCart = os
  .use(authMiddleware)
  .output(GetCartOutputSchema)
  .handler(async ({ context }: { context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }
    return getCartHelper(context.user.id);
  });

/**
 * 新增商品至購物車
 */
export const addItem = os
  .use(authMiddleware)
  .input(AddCartItemInputSchema)
  .output(GetCartOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof AddCartItemInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }
    const { productId, quantity } = input;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: context.user.id,
          productId,
        },
      },
    });

    const newQuantity = existing ? existing.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: context.user.id,
          productId,
          quantity: newQuantity,
        },
      });
    }

    return getCartHelper(context.user.id);
  });

/**
 * 更新購物車商品數量
 */
export const updateItem = os
  .use(authMiddleware)
  .input(UpdateCartItemInputSchema)
  .output(GetCartOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateCartItemInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }
    const { productId, quantity } = input;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (quantity > product.stock) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: context.user.id,
          productId,
        },
      },
    });

    if (!existing) {
      throw new Error('CART_ITEM_NOT_FOUND');
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    return getCartHelper(context.user.id);
  });

/**
 * 移除購物車中的商品
 */
export const removeItem = os
  .use(authMiddleware)
  .input(RemoveCartItemInputSchema)
  .output(GetCartOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof RemoveCartItemInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }
    const { productId } = input;

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: context.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.cartItem.delete({
        where: { id: existing.id },
      });
    }

    return getCartHelper(context.user.id);
  });

export const cartRouter = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
export type CartRouter = typeof cartRouter;
