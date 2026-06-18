import { z } from 'zod';
import { os } from '@orpc/server';
import { HelloInputSchema, HelloOutputSchema } from '../../shared/index.js';
import { userRouter } from './user.js';

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
};

// Export router type for the frontend
export type AppRouter = typeof appRouter;
