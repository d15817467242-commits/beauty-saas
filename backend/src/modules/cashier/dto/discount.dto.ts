import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, IsEnum, IsArray, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountValueType, DiscountScope } from '../entities/discount.entity';

export { DiscountValueType, DiscountScope };

export class CreateDiscountDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  discountCode?: string;

  @IsEnum(DiscountValueType)
  discountType: DiscountValueType;

  @Type(() => Number)
  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsEnum(DiscountScope)
  discountScope?: DiscountScope;

  @IsOptional()
  @IsArray()
  scopeIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  perUserLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  discountCode?: string;

  @IsOptional()
  @IsEnum(DiscountValueType)
  discountType?: DiscountValueType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsEnum(DiscountScope)
  discountScope?: DiscountScope;

  @IsOptional()
  @IsArray()
  scopeIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  perUserLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApplyDiscountDto {
  @IsNotEmpty()
  @IsString()
  discountCode: string;

  @IsNotEmpty()
  @IsString()
  memberId?: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsArray()
  itemIds?: string[];
}
