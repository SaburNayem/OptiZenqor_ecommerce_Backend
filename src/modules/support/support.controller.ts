import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { CreateSupportThreadDto } from './dto/create-support-thread.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('threads')
  findThreads(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.supportService.findThreads(user);
  }

  @Post('threads')
  createThread(@CurrentUser('id') userId: string, @Body() dto: CreateSupportThreadDto) {
    return this.supportService.createThread(userId, dto);
  }

  @Get('threads/:id')
  findById(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.supportService.findThreadById(id, user);
  }

  @Post('threads/:id/messages')
  addMessage(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: CreateSupportMessageDto,
  ) {
    return this.supportService.addMessage(id, user, dto);
  }

  @Patch('threads/:id/close')
  close(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.supportService.close(id, user);
  }

  @Patch('threads/:id/reopen')
  reopen(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.supportService.reopen(id, user);
  }
}
