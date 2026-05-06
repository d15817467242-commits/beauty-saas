import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TrendGroupBy {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum RankingType {
  SERVICE = 'service',
  EMPLOYEE = 'employee',
  PRODUCT = 'product',
}

export class OverviewQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD
}

export class RealtimeQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class TrendQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TrendGroupBy)
  groupBy?: TrendGroupBy;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class RankingQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(RankingType)
  type?: RankingType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  storeId?: string;
}

export class MapQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  level?: number; // 地图层级 1-省份 2-城市 3-区县
}
