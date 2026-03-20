import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';

@Injectable()
export class HomepageService {
  constructor(private readonly prisma: PrismaService) {}

  getPublicHomepage() {
    return this.prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' },
    });
  }

  getAdminHomepage() {
    return this.prisma.homepageSection.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async update(key: string, dto: UpdateHomepageSectionDto) {
    const section = await this.prisma.homepageSection.findUnique({
      where: { key },
    });

    if (!section) {
      throw new NotFoundException('Homepage section not found');
    }

    return this.prisma.homepageSection.update({
      where: { key },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        isActive: dto.isActive,
        contentJson: dto.contentJson as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
