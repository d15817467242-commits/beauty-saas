import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockCheckItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  systemQuantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateStockCheckDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockCheckItemDto)
  items?: StockCheckItemDto[];

  @IsOptional()
  @IsString()
  remark?: string;
}

export class RecordStockCheckItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  actualQuantity: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryStockCheckDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

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
