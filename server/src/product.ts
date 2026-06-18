import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  ProductDetailOutputSchema
} from '../../shared/index.js';

export const getProducts = os
  .input(GetProductsInputSchema)
  .output(GetProductsOutputSchema)
  .handler(async ({ input }: { input: z.infer<typeof GetProductsInputSchema> }) => {
    const { page, limit, categoryId, search, includeInactive } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Map Decimal to number for Zod compatibility
    const formattedProducts = products.map((p) => ({
      ...p,
      price: Number(p.price),
    }));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

export const getProductById = os
  .input(
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().optional(),
    }).refine((data) => data.id || data.slug, '必須提供商品 id 或 slug')
  )
  .output(ProductDetailOutputSchema)
  .handler(async ({ input }: { input: { id?: string; slug?: string } }) => {
    const { id, slug } = input;

    const product = await prisma.product.findFirst({
      where: id ? { id } : { slug },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    return {
      ...product,
      price: Number(product.price),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
    };
  });

export const productRouter = {
  getProducts,
  getProductById,
};
export type ProductRouter = typeof productRouter;
