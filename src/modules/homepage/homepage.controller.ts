import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateHomepageSectionDto } from './dto/create-homepage-section.dto';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';
import { HomepageService } from './homepage.service';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Public()
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
  @Post('admin')
  create(@Body() dto: CreateHomepageSectionDto) {
    return this.homepageService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateHomepageSectionDto) {
    return this.homepageService.update(key, dto);
  }
}
