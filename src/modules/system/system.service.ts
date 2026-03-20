import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'optizenqor-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  getConfig() {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateConfig(key: string, dto: UpdateSystemConfigDto) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: dto.value,
        description: dto.description,
      },
      create: {
        key,
        value: dto.value,
        description: dto.description,
      },
    });
  }
}
