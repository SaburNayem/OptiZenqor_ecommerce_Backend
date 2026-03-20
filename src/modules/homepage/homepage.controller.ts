import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';
import { HomepageService } from './homepage.service';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  getPublicHomepage() {
    return this.homepageService.getPublicHomepage();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin')
  getAdminHomepage() {
    return this.homepageService.getAdminHomepage();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateHomepageSectionDto) {
    return this.homepageService.update(key, dto);
  }
}
