import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PointsGoodsType, PointsMallStatus, ExchangeStatus } from '../points-mall.entity';

export class CreatePointsGoodsDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsEnum(PointsGoodsType)
  type: PointsGoodsType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cashPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockCount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  exchangeLimit?: number;

  @IsEnum(PointsMallStatus)
  @IsOptional()
  status?: PointsMallStatus;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  mainImage?: string;

  @IsArray()
  @IsOptional()
  detailImages?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  serviceConfig?: {
    serviceId?: string;
    serviceName?: string;
    validDays?: number;
  };

  @IsObject()
  @IsOptional()
  couponConfig?: {
    couponId?: string;
    couponName?: string;
  };

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;
}

export class UpdatePointsGoodsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsEnum(PointsGoodsType)
  @IsOptional()
  type?: PointsGoodsType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pointsRequired?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cashPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockCount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  exchangeLimit?: number;

  @IsEnum(PointsMallStatus)
  @IsOptional()
  status?: PointsMallStatus;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  mainImage?: string;

  @IsArray()
  @IsOptional()
  detailImages?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  serviceConfig?: any;

  @IsObject()
  @IsOptional()
  couponConfig?: any;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ExchangeGoodsDto {
  @IsString()
  goodsId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsObject()
  @IsOptional()
  deliveryInfo?: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
}

export class UpdateExchangeStatusDto {
  @IsString()
  exchangeId: string;

  @IsEnum(ExchangeStatus)
  status: ExchangeStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  trackingCompany?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PointsMallQueryDto {
  @IsEnum(PointsMallStatus)
  @IsOptional()
  status?: PointsMallStatus;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(PointsGoodsType)
  @IsOptional()
  type?: PointsGoodsType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class ExchangeQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string;

  @IsEnum(ExchangeStatus)
  @IsOptional()
  status?: ExchangeStatus;

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
