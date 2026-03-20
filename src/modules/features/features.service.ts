import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  create(dto: CreateFeatureFlagDto) {
    return this.prisma.featureFlag.create({
      data: {
        ...dto,
        environment: dto.environment ?? 'PUBLIC',
        isEnabled: dto.isEnabled ?? false,
        rolloutPercentage: dto.rolloutPercentage ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateFeatureFlagDto) {
    await this.ensureFeatureFlag(id);
    return this.prisma.featureFlag.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureFeatureFlag(id);
    await this.prisma.featureFlag.delete({
      where: { id },
    });
    return { message: 'Feature flag deleted' };
  }

  private async ensureFeatureFlag(id: string) {
    const feature = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException('Feature flag not found');
    }

    return feature;
  }
}
