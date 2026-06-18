import { z } from 'zod';
import { os } from '@orpc/server';
import { HelloInputSchema, HelloOutputSchema } from '../../shared/index.js';
import { userRouter } from './user.js';
import { productRouter } from './product.js';
import { cartRouter } from './cart.js';
import { orderRouter } from './order.js';
import { couponRouter } from './coupon.js';

export const hello = os
  .input(HelloInputSchema)
  .output(HelloOutputSchema)
  .handler(async ({ input }: { input: z.infer<typeof HelloInputSchema> }) => {
    return {
      message: `Hello, ${input.name}! Welcome to AngoRPC!`,
      timestamp: new Date().toISOString(),
    };
  });

export const appRouter = {
  hello,
  user: userRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  coupon: couponRouter,
};

// Export router type for the frontend
export type AppRouter = typeof appRouter;


