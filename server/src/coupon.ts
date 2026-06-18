import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import {
  ValidateCouponInputSchema,
  ValidateCouponOutputSchema
} from '../../shared/index.js';

export const validateCoupon = os
  .use(authMiddleware)
  .input(ValidateCouponInputSchema)
  .output(ValidateCouponOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof ValidateCouponInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const { code, orderAmount } = input;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return {
        valid: false,
        error: '優惠碼不存在',
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        error: '此優惠券已被停用',
      };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return {
        valid: false,
        error: '此優惠券已過期',
      };
    }

    const minSpend = Number(coupon.minSpend);
    if (orderAmount < minSpend) {
      return {
        valid: false,
        error: `消費金額未達最低門檻 $${minSpend.toFixed(2)}`,
      };
    }

    // 計算折抵金額
    let discountAmount = 0;
    const value = Number(coupon.value);

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = orderAmount * (value / 100);
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = value;
    }

    // 折抵上限為商品金額小計
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: Number(coupon.value),
        minSpend: Number(coupon.minSpend),
      },
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  });

export const couponRouter = {
  validateCoupon,
};

export type CouponRouter = typeof couponRouter;
