import { IsNotEmpty, IsOptional, IsString, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { CouponSource } from '../entities/coupon-verification.entity';

export class VerifyCouponDto {
  @IsNotEmpty()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsEnum(CouponSource)
  couponSource?: CouponSource;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  couponCode: string;

  @IsOptional()
  @IsEnum(CouponSource)
  couponSource?: CouponSource;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  couponName: string;

  @IsNotEmpty()
  couponValue: number;

  @IsNotEmpty()
  paidAmount: number;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsDateString()
  expireTime?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CancelCouponDto {
  @IsNotEmpty()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
