import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UploadsService } from './uploads.service';

class CreateUploadIntentDto {
  @IsString()
  filename!: string;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('intent')
  createUploadIntent(@Body() dto: CreateUploadIntentDto) {
    return this.uploadsService.createUploadIntent(dto.filename);
  }
}
