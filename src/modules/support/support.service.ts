import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupportSenderType, SupportThreadStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { CreateSupportThreadDto } from './dto/create-support-thread.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  findThreads(requester: { id: string; role: UserRole }) {
    return this.prisma.supportThread.findMany({
      where:
        requester.role === UserRole.CUSTOMER
          ? {
              userId: requester.id,
            }
          : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createThread(userId: string, dto: CreateSupportThreadDto) {
    return this.prisma.supportThread.create({
      data: {
        userId,
        subject: dto.subject,
        priority: dto.priority ?? 'MEDIUM',
        status: SupportThreadStatus.OPEN,
        messages: {
          create: {
            senderId: userId,
            senderType: SupportSenderType.CUSTOMER,
            message: dto.message,
          },
        },
      },
      include: { messages: true },
    });
  }

  async findThreadById(id: string, requester: { id: string; role: UserRole }) {
    const thread = await this.prisma.supportThread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Support thread not found');
    }

    if (requester.role === UserRole.CUSTOMER && thread.userId !== requester.id) {
      throw new ForbiddenException('You cannot access this thread');
    }

    return thread;
  }

  async addMessage(
    threadId: string,
    requester: { id: string; role: UserRole },
    dto: CreateSupportMessageDto,
  ) {
    const thread = await this.findThreadById(threadId, requester);

    return this.prisma.supportMessage.create({
      data: {
        threadId: thread.id,
        senderId: requester.id,
        senderType:
          requester.role === UserRole.CUSTOMER ? SupportSenderType.CUSTOMER : SupportSenderType.ADMIN,
        message: dto.message,
      },
    });
  }

  async close(id: string, requester: { id: string; role: UserRole }) {
    await this.findThreadById(id, requester);
    return this.prisma.supportThread.update({
      where: { id },
      data: { status: SupportThreadStatus.CLOSED },
    });
  }

  async reopen(id: string, requester: { id: string; role: UserRole }) {
    await this.findThreadById(id, requester);
    return this.prisma.supportThread.update({
      where: { id },
      data: { status: SupportThreadStatus.OPEN },
    });
  }
}
