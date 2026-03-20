import { PartialType } from '@nestjs/swagger';
import { CreateContentPostDto } from './create-content-post.dto';

export class UpdateContentPostDto extends PartialType(CreateContentPostDto) {}
