import { IsString, IsNumber, IsOptional, IsDateString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FlashSaleStatus } from '../flash-sale.entity';

export class CreateFlashSaleDto {
  @IsString()
  name: string;

  @IsString()
  serviceId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  flashPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalStock: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  perLimit?: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFlashSaleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(FlashSaleStatus)
  @IsOptional()
  status?: FlashSaleStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  flashPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalStock?: number;
}

export class BuyFlashSaleDto {
  @IsString()
  flashSaleId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}
