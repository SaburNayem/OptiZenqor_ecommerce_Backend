import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const [cart, address] = await Promise.all([
      this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      }),
      this.prisma.address.findUnique({
        where: { id: dto.addressId },
      }),
    ]);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const deliveryFee = dto.deliveryFee ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const total = subtotal + deliveryFee - discountAmount;

    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE' || !item.product.isVisible) {
        throw new BadRequestException(`Product ${item.product.name} is not available`);
      }

      if (item.quantity > item.product.stockQuantity) {
        throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          paymentStatus: 'PENDING',
          subtotal,
          deliveryFee,
          discountAmount,
          total,
          currency: dto.currency ?? 'BDT',
          shippingAddressSnapshot: {
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            area: address.area,
            postalCode: address.postalCode,
            country: address.country,
          } satisfies Prisma.InputJsonValue,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productImage: item.product.imageUrl,
              unitPrice: item.product.price,
              quantity: item.quantity,
              totalPrice: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(orderId: string, requester: { id: string; role: UserRole }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (requester.role === UserRole.CUSTOMER && order.userId !== requester.id) {
      throw new ForbiddenException('You cannot access this order');
    }

    const { passwordHash, ...safeUser } = order.user;
    return {
      ...order,
      user: safeUser,
    };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    await this.ensureOrder(orderId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
      },
    });
  }

  private async ensureOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private generateOrderNumber() {
    return `OZ-${Date.now()}`;
  }
}
