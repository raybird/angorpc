import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';
import {
  ValidateCouponInputSchema,
  ValidateCouponOutputSchema,
  GetCouponsInputSchema,
  GetCouponsOutputSchema,
  CreateCouponInputSchema,
  UpdateCouponInputSchema,
  CouponSchema
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

export const getCoupons = os
  .use(authMiddleware)
  .input(GetCouponsInputSchema)
  .output(GetCouponsOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof GetCouponsInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const { page, limit, search, isActive } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    const formattedCoupons = coupons.map(c => ({
      ...c,
      value: Number(c.value),
      minSpend: Number(c.minSpend),
    }));

    return {
      coupons: formattedCoupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

export const createCoupon = os
  .use(authMiddleware)
  .input(CreateCouponInputSchema)
  .output(CouponSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof CreateCouponInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const codeUpper = input.code.toUpperCase();

    // 檢查 code 是否重複
    const existing = await prisma.coupon.findUnique({
      where: { code: codeUpper },
    });
    if (existing) {
      throw new Error('COUPON_CODE_ALREADY_EXISTS');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: codeUpper,
        discountType: input.discountType,
        value: input.value,
        minSpend: input.minSpend,
        isActive: input.isActive,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    return {
      ...coupon,
      value: Number(coupon.value),
      minSpend: Number(coupon.minSpend),
    };
  });

export const updateCoupon = os
  .use(authMiddleware)
  .input(UpdateCouponInputSchema)
  .output(CouponSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateCouponInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const dataToUpdate: any = {};
    if (input.code !== undefined) {
      const codeUpper = input.code.toUpperCase();
      // 確認是否與其他 coupon code 重複
      const existing = await prisma.coupon.findFirst({
        where: {
          code: codeUpper,
          NOT: { id: input.id },
        },
      });
      if (existing) {
        throw new Error('COUPON_CODE_ALREADY_EXISTS');
      }
      dataToUpdate.code = codeUpper;
    }

    if (input.discountType !== undefined) dataToUpdate.discountType = input.discountType;
    if (input.value !== undefined) {
      // 這裡需要做進一步的百分比面額限制校驗（如果 Zod refine 沒完全捕捉，在這裡做多重保護）
      const type = input.discountType || (await prisma.coupon.findUnique({ where: { id: input.id } }))?.discountType;
      if (type === 'PERCENTAGE' && input.value > 100) {
        throw new Error('PERCENTAGE_DISCOUNT_VALUE_MUST_BE_LESS_THAN_OR_EQUAL_TO_100');
      }
      dataToUpdate.value = input.value;
    }
    if (input.minSpend !== undefined) dataToUpdate.minSpend = input.minSpend;
    if (input.isActive !== undefined) dataToUpdate.isActive = input.isActive;
    if (input.expiresAt !== undefined) {
      dataToUpdate.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }

    const coupon = await prisma.coupon.update({
      where: { id: input.id },
      data: dataToUpdate,
    });

    return {
      ...coupon,
      value: Number(coupon.value),
      minSpend: Number(coupon.minSpend),
    };
  });

export const couponRouter = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
};

export type CouponRouter = typeof couponRouter;
