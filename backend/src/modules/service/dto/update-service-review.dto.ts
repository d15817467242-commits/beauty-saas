import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceReviewDto } from './create-service-review.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateServiceReviewDto extends PartialType(OmitType(CreateServiceReviewDto, ['serviceId', 'userId'] as const)) {}

export class AdminReplyDto {
  @IsString()
  @IsNotEmpty({ message: '回复内容不能为空' })
  content: string;
}
