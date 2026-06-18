import { os } from '@orpc/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './db.js';
import { JWT_SECRET, authMiddleware, AuthContext } from './middleware/auth.js';
import {
  LoginInputSchema,
  LoginOutputSchema,
  RegisterInputSchema,
  RegisterOutputSchema,
  ProfileOutputSchema
} from '../../shared/index.js';

export const register = os
  .input(RegisterInputSchema)
  .output(RegisterOutputSchema)
  .handler(async ({ input }: { input: z.infer<typeof RegisterInputSchema> }) => {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: 'USER',
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: user.role,
      },
    };
  });

export const login = os
  .input(LoginInputSchema)
  .output(LoginOutputSchema)
  .handler(async ({ input }: { input: z.infer<typeof LoginInputSchema> }) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: user.role,
      },
    };
  });

export const getProfile = os
  .use(authMiddleware)
  .output(ProfileOutputSchema)
  .handler(async ({ context }: { context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
    });
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  });

export const userRouter = {
  register,
  login,
  getProfile,
};
export type UserRouter = typeof userRouter;
