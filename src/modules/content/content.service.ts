import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateContentPostDto } from './dto/create-content-post.dto';
import { UpdateContentPostDto } from './dto/update-content-post.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contentPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.contentPost.findUnique({
      where: { slug },
    });

    if (!post) {
      throw new NotFoundException('Content post not found');
    }

    return post;
  }

  create(dto: CreateContentPostDto) {
    return this.prisma.contentPost.create({
      data: {
        ...dto,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateContentPostDto) {
    await this.ensurePost(id);
    return this.prisma.contentPost.update({
      where: { id },
      data: {
        ...dto,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensurePost(id);
    await this.prisma.contentPost.delete({
      where: { id },
    });

    return { message: 'Content deleted' };
  }

  private async ensurePost(id: string) {
    const post = await this.prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Content post not found');
    }

    return post;
  }
}
