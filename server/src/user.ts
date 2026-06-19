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
  UserStatsOutputSchema,
  UpdateProfileInputSchema,
  UserAddressSchema,
  CreateAddressInputSchema,
  UpdateAddressInputSchema
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

export const updateProfile = os
  .use(authMiddleware)
  .input(UpdateProfileInputSchema)
  .output(ProfileOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateProfileInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const data: any = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.password !== undefined) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: context.user.id },
      data,
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

export const getAddresses = os
  .use(authMiddleware)
  .output(z.array(UserAddressSchema))
  .handler(async ({ context }: { context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: context.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return addresses.map(addr => ({
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
    }));
  });

export const createAddress = os
  .use(authMiddleware)
  .input(CreateAddressInputSchema)
  .output(UserAddressSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof CreateAddressInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    // 若設定為預設，需先將該用戶其他所有地址設為非預設
    if (input.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: context.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 如果是用戶的第一筆地址，強制定為預設
    const count = await prisma.userAddress.count({
      where: { userId: context.user.id }
    });
    const isDefault = count === 0 ? true : input.isDefault;

    const addr = await prisma.userAddress.create({
      data: {
        userId: context.user.id,
        recipientName: input.recipientName,
        phone: input.phone,
        address: input.address,
        postalCode: input.postalCode,
        isDefault,
      }
    });

    return {
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
    };
  });

export const updateAddress = os
  .use(authMiddleware)
  .input(UpdateAddressInputSchema)
  .output(UserAddressSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateAddressInputSchema>; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const existing = await prisma.userAddress.findUnique({
      where: { id: input.id }
    });

    if (!existing || existing.userId !== context.user.id) {
      throw new Error('ADDRESS_NOT_FOUND_OR_ACCESS_DENIED');
    }

    // 若設定為預設，需先將該用戶其他所有地址設為非預設
    if (input.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: context.user.id, isDefault: true, NOT: { id: input.id } },
        data: { isDefault: false },
      });
    }

    const data: any = {};
    if (input.recipientName !== undefined) data.recipientName = input.recipientName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.address !== undefined) data.address = input.address;
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    const addr = await prisma.userAddress.update({
      where: { id: input.id },
      data,
    });

    return {
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
    };
  });

export const deleteAddress = os
  .use(authMiddleware)
  .input(z.object({ id: z.string().uuid() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }: { input: { id: string }; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const existing = await prisma.userAddress.findUnique({
      where: { id: input.id }
    });

    if (!existing || existing.userId !== context.user.id) {
      throw new Error('ADDRESS_NOT_FOUND_OR_ACCESS_DENIED');
    }

    await prisma.userAddress.delete({
      where: { id: input.id }
    });

    // 如果刪除的是預設地址，且還有其他地址，把最新的一筆設為預設
    if (existing.isDefault) {
      const remaining = await prisma.userAddress.findFirst({
        where: { userId: context.user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (remaining) {
        await prisma.userAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true }
        });
      }
    }

    return { success: true };
  });

export const setDefaultAddress = os
  .use(authMiddleware)
  .input(z.object({ id: z.string().uuid() }))
  .output(UserAddressSchema)
  .handler(async ({ input, context }: { input: { id: string }; context: AuthContext }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED');
    }

    const existing = await prisma.userAddress.findUnique({
      where: { id: input.id }
    });

    if (!existing || existing.userId !== context.user.id) {
      throw new Error('ADDRESS_NOT_FOUND_OR_ACCESS_DENIED');
    }

    // 將所有其他地址設為非預設
    await prisma.userAddress.updateMany({
      where: { userId: context.user.id, isDefault: true },
      data: { isDefault: false },
    });

    const addr = await prisma.userAddress.update({
      where: { id: input.id },
      data: { isDefault: true }
    });

    return {
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
    };
  });

export const userRouter = {
  register,
  login,
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUsers,
  updateUserRole,
  getUserStats,
};
export type UserRouter = typeof userRouter;
