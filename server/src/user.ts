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
  ProfileOutputSchema,
  GetUsersInputSchema,
  GetUsersOutputSchema,
  UpdateUserRoleInputSchema,
  UserStatsOutputSchema
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

export const getUsers = os
  .use(authMiddleware)
  .input(GetUsersInputSchema)
  .output(GetUsersOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof GetUsersInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const { page, limit, search, role } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

export const updateUserRole = os
  .use(authMiddleware)
  .input(UpdateUserRoleInputSchema)
  .output(ProfileOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateUserRoleInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    if (input.id === context.user.id) {
      throw new Error('CANNOT_CHANGE_OWN_ROLE');
    }

    const user = await prisma.user.update({
      where: { id: input.id },
      data: {
        role: input.role,
      },
    });

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

export const getUserStats = os
  .use(authMiddleware)
  .input(z.object({ id: z.string().uuid() }))
  .output(UserStatsOutputSchema)
  .handler(async ({ input, context }: { input: { id: string }; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const [totalOrders, spentAggregation] = await Promise.all([
      prisma.order.count({
        where: { userId: input.id }
      }),
      prisma.order.aggregate({
        where: { userId: input.id },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const totalSpent = spentAggregation._sum.totalAmount ? Number(spentAggregation._sum.totalAmount) : 0;

    return {
      totalOrders,
      totalSpent
    };
  });

export const userRouter = {
  register,
  login,
  getProfile,
  getUsers,
  updateUserRole,
  getUserStats,
};
export type UserRouter = typeof userRouter;
