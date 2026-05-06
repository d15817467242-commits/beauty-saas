import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UsageType } from '../coupon-usage.entity';

export class VerifyCouponDto {
  @IsString()
  memberCouponId: string;

  @IsString()
  orderId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class RefundCouponDto {
  @IsString()
  memberCouponId: string;

  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CouponStatisticsQueryDto {
  @IsString()
  couponId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CouponUsageQueryDto {
  @IsString()
  @IsOptional()
  couponId?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsEnum(UsageType)
  @IsOptional()
  type?: UsageType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}
