import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { StockTakeStatus } from '../entities/stock-take.entity';

export class CreateStockTakeItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  systemQuantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateStockTakeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTakeItemDto)
  items: CreateStockTakeItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateStockTakeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTakeItemDto)
  @IsOptional()
  items?: CreateStockTakeItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class RecordStockTakeItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ProcessStockTakeDifferenceDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryStockTakeDto {
  @IsEnum(StockTakeStatus)
  @IsOptional()
  status?: StockTakeStatus;

  @IsString()
  @IsOptional()
  stockTakeNo?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
