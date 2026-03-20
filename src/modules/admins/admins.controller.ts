import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminsService } from './admins.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('overview')
  overview() {
    return this.adminsService.overview();
  }

  @Get('orders')
  getOrders() {
    return this.adminsService.getOrders();
  }

  @Get('customers')
  getCustomers() {
    return this.adminsService.getCustomers();
  }

  @Get('products')
  getProducts() {
    return this.adminsService.getProducts();
  }

  @Get('content')
  getContent() {
    return this.adminsService.getContent();
  }

  @Get('support')
  getSupport() {
    return this.adminsService.getSupport();
  }

  @Get('features')
  getFeatures() {
    return this.adminsService.getFeatures();
  }
}
