import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferStatus } from '../entities/stock-transfer.entity';

export class CreateStockTransferItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateStockTransferDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  fromLocation: string;

  @IsString()
  toLocation: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items: CreateStockTransferItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateStockTransferDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  fromLocation?: string;

  @IsString()
  @IsOptional()
  toLocation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  @IsOptional()
  items?: CreateStockTransferItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ApproveStockTransferDto {
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}

export class QueryStockTransferDto {
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @IsString()
  @IsOptional()
  transferNo?: string;

  @IsString()
  @IsOptional()
  fromLocation?: string;

  @IsString()
  @IsOptional()
  toLocation?: string;
}
