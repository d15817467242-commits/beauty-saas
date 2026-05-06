import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus } from '../entities/purchase.entity';

export class CreatePurchaseOrderItemDto {
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

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdatePurchaseOrderDto {
  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  @IsOptional()
  items?: CreatePurchaseOrderItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ApprovePurchaseOrderDto {
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}

export class ReceivePurchaseItemDto {
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
  unitPrice?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseItemDto)
  items: ReceivePurchaseItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryPurchaseOrderDto {
  @IsEnum(PurchaseStatus)
  @IsOptional()
  status?: PurchaseStatus;

  @IsString()
  @IsOptional()
  orderNo?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;
}
