import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType, CouponStatus } from '../coupon.entity';

export class CreateCouponDto {
  @IsString()
  name: string;

  @IsEnum(CouponType)
  type: CouponType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  totalCount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  perLimit?: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsArray()
  @IsOptional()
  applicableServices?: string[];

  @IsArray()
  @IsOptional()
  applicableProducts?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ReceiveCouponDto {
  @IsString()
  couponId: string;
}

export class UseCouponDto {
  @IsString()
  memberCouponId: string;

  @IsString()
  orderId: string;
}
