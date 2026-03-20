import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.ensureCart(userId);
    const product = await this.ensurePurchasableProduct(dto.productId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: dto.productId,
          },
        },
      });

      const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;
      if (nextQuantity > product.stockQuantity) {
        throw new BadRequestException('Requested quantity exceeds stock');
      }

      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: nextQuantity,
            unitPrice: product.price,
          },
        });
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity,
          unitPrice: product.price,
        },
      });
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.product.stockQuantity) {
      throw new BadRequestException('Requested quantity exceeds stock');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: dto.quantity,
        unitPrice: item.product.price,
      },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Cart item removed' };
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared' };
  }

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
    });
  }

  private async ensurePurchasableProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isVisible || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not available');
    }

    return product;
  }
}
