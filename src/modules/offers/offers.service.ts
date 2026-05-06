import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.offer.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: {
            product: {
              status: 'ACTIVE',
              isVisible: true,
              OR: [{ primaryCategoryId: null }, { primaryCategory: { isActive: true } }],
            },
          },
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateOfferDto) {
    return this.prisma.offer.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateOfferDto) {
    await this.ensureOffer(id);
    return this.prisma.offer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureOffer(id);
    await this.prisma.offer.delete({
      where: { id },
    });

    return { message: 'Offer deleted' };
  }

  private async ensureOffer(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }
}
