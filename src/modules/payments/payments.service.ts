import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PreparePaymentDto } from './dto/prepare-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  getProviders() {
    return [
      {
        code: 'mock',
        label: 'Mock Gateway',
        status: 'active',
        capabilities: ['authorize', 'capture', 'refund'],
      },
      {
        code: 'stripe-ready',
        label: 'Stripe Adapter',
        status: 'planned',
        capabilities: ['future-integration'],
      },
      {
        code: 'sslcommerz-ready',
        label: 'SSLCommerz Adapter',
        status: 'planned',
        capabilities: ['future-integration'],
      },
    ];
  }

  async prepare(dto: PreparePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderId: order.id,
      provider: 'mock',
      paymentStatus: order.paymentStatus,
      amount: order.total,
      currency: order.currency,
      nextAction: 'Use provider abstraction for future gateway integration',
    };
  }
}
