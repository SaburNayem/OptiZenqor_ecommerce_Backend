import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSupportThreadDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiPropertyOptional({ enum: SupportPriority })
  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;

  @ApiProperty()
  @IsString()
  message!: string;
}
