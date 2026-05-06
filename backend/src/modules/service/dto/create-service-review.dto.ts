import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceReviewDto {
  @IsString()
  @IsNotEmpty({ message: '服务项目ID不能为空' })
  serviceId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: '评分最低为1星' })
  @Max(5, { message: '评分最高为5星' })
  rating: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
