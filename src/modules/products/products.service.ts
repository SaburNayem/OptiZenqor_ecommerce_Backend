import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListProductsDto) {
    const andFilters: Prisma.ProductWhereInput[] = [];

    if (query.search) {
      andFilters.push({
        OR: [
          { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          { sku: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (query.categoryId) {
      andFilters.push({
        OR: [
          { primaryCategoryId: query.categoryId },
          { categories: { some: { categoryId: query.categoryId } } },
        ],
      });
    }

    andFilters.push({
      OR: [{ primaryCategoryId: null }, { primaryCategory: { isActive: true } }],
    });

    const where: Prisma.ProductWhereInput = {
      ...(typeof query.featured === 'boolean' ? { isFeatured: query.featured } : {}),
      ...(typeof query.visible === 'boolean' ? { isVisible: query.visible } : { isVisible: true }),
      status: ProductStatus.ACTIVE,
      AND: andFilters,
    };

    return this.prisma.product.findMany({
      where,
      include: {
        primaryCategory: true,
        categories: {
          include: { category: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: ProductStatus.ACTIVE,
        isVisible: true,
        OR: [{ primaryCategoryId: null }, { primaryCategory: { isActive: true } }],
      },
      include: {
        primaryCategory: true,
        categories: { include: { category: true } },
        offers: { include: { offer: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
        isVisible: true,
        OR: [{ primaryCategoryId: null }, { primaryCategory: { isActive: true } }],
      },
      include: {
        primaryCategory: true,
        categories: { include: { category: true } },
        offers: { include: { offer: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          shortDescription: dto.shortDescription,
          sku: dto.sku,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice,
          stockQuantity: dto.stockQuantity,
          imageUrl: dto.imageUrl,
          galleryImages: dto.galleryImages ?? [],
          isFeatured: dto.isFeatured ?? false,
          isPopular: dto.isPopular ?? false,
          isVisible: dto.isVisible ?? true,
          status: dto.status ?? ProductStatus.DRAFT,
          primaryCategoryId: dto.primaryCategoryId,
        },
      });

      if (dto.categoryIds?.length) {
        await tx.productCategoryPivot.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          primaryCategory: true,
          categories: { include: { category: true } },
        },
      });
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureProduct(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          shortDescription: dto.shortDescription,
          sku: dto.sku,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice,
          stockQuantity: dto.stockQuantity,
          imageUrl: dto.imageUrl,
          galleryImages: dto.galleryImages,
          isFeatured: dto.isFeatured,
          isPopular: dto.isPopular,
          isVisible: dto.isVisible,
          status: dto.status,
          primaryCategoryId: dto.primaryCategoryId,
        },
      });

      if (dto.categoryIds) {
        await tx.productCategoryPivot.deleteMany({
          where: { productId: id },
        });

        if (dto.categoryIds.length) {
          await tx.productCategoryPivot.createMany({
            data: dto.categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          primaryCategory: true,
          categories: { include: { category: true } },
        },
      });
    });
  }

  async remove(id: string) {
    await this.ensureProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.ARCHIVED,
        isVisible: false,
      },
    });
  }

  private async ensureProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
