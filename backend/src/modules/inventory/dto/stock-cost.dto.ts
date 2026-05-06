import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateCostDto {
  @IsString()
  @IsOptional()
  productId?: string;
}

export class QueryStockCostDto {
  @IsString()
  productId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateProductCostDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
