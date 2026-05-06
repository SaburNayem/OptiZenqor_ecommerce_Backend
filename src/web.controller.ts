import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class WebController {
  @Public()
  @Get()
  getStorefront(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'index.html'));
  }

  @Public()
  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'dashboard', 'index.html'));
  }
}
