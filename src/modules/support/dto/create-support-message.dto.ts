import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSupportMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;
}
