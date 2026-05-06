import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsumableMovementType } from '../consumable.entity';

export class CreateConsumableDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  consumableCode?: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  warningStock?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateConsumableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  warningStock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateConsumableMovementDto {
  @IsString()
  consumableId: string;

  @IsEnum(ConsumableMovementType)
  movementType: ConsumableMovementType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  consumptionId?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateServiceConsumableDto {
  @IsString()
  serviceId: string;

  @IsString()
  consumableId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
