import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: '服务名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: '价格不能为负数' })
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  memberPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedCommission?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  notice?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
