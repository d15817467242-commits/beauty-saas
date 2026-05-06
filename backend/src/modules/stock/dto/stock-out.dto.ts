import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { StockOutType } from '../entities/stock-out.entity';

export class StockOutItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateStockOutDto {
  @IsEnum(StockOutType)
  type: StockOutType;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockOutItemDto)
  items: StockOutItemDto[];

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryStockOutDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsEnum(StockOutType)
  type?: StockOutType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;
}
