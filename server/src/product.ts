import { os } from '@orpc/server';
import { z } from 'zod';
import { prisma } from './db.js';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  ProductDetailOutputSchema,
  GetCategoriesOutputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema
} from '../../shared/index.js';
import { authMiddleware, AuthContext } from './middleware/auth.js';

export const getProducts = os
  .input(GetProductsInputSchema)
  .output(GetProductsOutputSchema)
  .handler(async ({ input }: { input: z.infer<typeof GetProductsInputSchema> }) => {
    const { page, limit, categoryId, search, includeInactive, minPrice, maxPrice } = input;
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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
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
        variants: true,
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
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        attributes: v.attributes as Record<string, any>,
      })),
    };
  });

export const getCategories = os
  .output(GetCategoriesOutputSchema)
  .handler(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return categories;
  });

export const createProduct = os
  .use(authMiddleware)
  .input(CreateProductInputSchema)
  .output(ProductDetailOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof CreateProductInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        price: input.price,
        categoryId: input.categoryId,
        stock: input.stock,
        isActive: input.isActive ?? true,
        variants: input.variants && input.variants.length > 0 ? {
          create: input.variants.map(v => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            stock: v.stock,
            attributes: v.attributes,
          }))
        } : undefined
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return {
      ...product,
      price: Number(product.price),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        attributes: v.attributes as Record<string, any>,
      })),
    };
  });

export const updateProduct = os
  .use(authMiddleware)
  .input(UpdateProductInputSchema)
  .output(ProductDetailOutputSchema)
  .handler(async ({ input, context }: { input: z.infer<typeof UpdateProductInputSchema>; context: AuthContext }) => {
    if (!context.user || context.user.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const product = await prisma.$transaction(async (tx) => {
      // 1. 更新商品基礎屬性
      await tx.product.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description !== undefined ? input.description : undefined,
          price: input.price,
          categoryId: input.categoryId,
          stock: input.stock,
          isActive: input.isActive,
        }
      });

      // 2. 如果有變體列表，進行 Upsert
      if (input.variants !== undefined) {
        const incomingIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
        
        // 刪除不在傳入列表中的變體 (注意：若被訂單關聯，Prisma 會因 RESTRICT 報錯，這也是預期的防護)
        await tx.productVariant.deleteMany({
          where: {
            productId: input.id,
            id: { notIn: incomingIds }
          }
        });

        // 建立或更新變體
        for (const v of input.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                name: v.name,
                price: v.price,
                stock: v.stock,
                attributes: v.attributes,
              }
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: input.id,
                sku: v.sku,
                name: v.name,
                price: v.price,
                stock: v.stock,
                attributes: v.attributes,
              }
            });
          }
        }
      }

      // 3. 查詢最新狀態並包含 category 與 variants
      return tx.product.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          category: true,
          variants: true,
        }
      });
    });

    return {
      ...product,
      price: Number(product.price),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        attributes: v.attributes as Record<string, any>,
      })),
    };
  });

export const productRouter = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
};
export type ProductRouter = typeof productRouter;
