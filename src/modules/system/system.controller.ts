import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Public()
  @Get('health')
  getHealth() {
    return this.systemService.getHealth();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('config')
  getConfig() {
    return this.systemService.getConfig();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('config/:key')
  updateConfig(@Param('key') key: string, @Body() dto: UpdateSystemConfigDto) {
    return this.systemService.updateConfig(key, dto);
  }
}
