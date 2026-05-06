import { Injectable } from '@nestjs/common';
import { ProductStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [customers, orders, products, openThreads, revenue] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.order.count(),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.supportThread.count({ where: { status: 'OPEN' } }),
      this.prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      customers,
      orders,
      products,
      openThreads,
      totalRevenue: revenue._sum.total ?? 0,
    };
  }

  getOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getCustomers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getProducts() {
    return this.prisma.product.findMany({
      include: {
        primaryCategory: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getContent() {
    return this.prisma.contentPost.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  getSupport() {
    return this.prisma.supportThread.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            avatarUrl: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getFeatures() {
    return this.prisma.featureFlag.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getAppControlCenter() {
    const [overview, homepageSections, offers, categories, products, content, features, systemConfig] =
      await Promise.all([
        this.overview(),
        this.prisma.homepageSection.findMany({ orderBy: { key: 'asc' } }),
        this.prisma.offer.findMany({
          include: {
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    isVisible: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.category.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.product.findMany({
          include: { primaryCategory: true },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.contentPost.findMany({ orderBy: { updatedAt: 'desc' } }),
        this.prisma.featureFlag.findMany({ orderBy: { updatedAt: 'desc' } }),
        this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } }),
      ]);

    return {
      overview,
      homepageSections,
      offers,
      categories,
      products,
      content,
      features,
      systemConfig,
      controls: {
        activeCategories: categories.filter((category) => category.isActive).length,
        visibleProducts: products.filter((product) => product.isVisible).length,
        activeOffers: offers.filter((offer) => offer.isActive).length,
        activeHomepageSections: homepageSections.filter((section) => section.isActive).length,
        publishedContent: content.filter((item) => item.status === 'PUBLISHED').length,
        enabledFeatureFlags: features.filter((feature) => feature.isEnabled).length,
      },
    };
  }
}
