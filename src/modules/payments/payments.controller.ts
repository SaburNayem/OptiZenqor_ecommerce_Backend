import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PreparePaymentDto } from './dto/prepare-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('providers')
  getProviders() {
    return this.paymentsService.getProviders();
  }

  @Post('prepare')
  prepare(@Body() dto: PreparePaymentDto) {
    return this.paymentsService.prepare(dto);
  }
}
