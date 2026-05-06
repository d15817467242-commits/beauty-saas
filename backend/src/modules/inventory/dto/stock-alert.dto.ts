import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertType, AlertStatus } from '../entities/stock-alert.entity';

export class CreateStockAlertRuleDto {
  @IsString()
  name: string;

  @IsEnum(AlertType)
  alertType: AlertType;

  @IsString()
  @IsOptional()
  category?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  thresholdValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  daysThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notifyUsers?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateStockAlertRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  thresholdValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  daysThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notifyUsers?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class HandleStockAlertDto {
  @IsString()
  @IsOptional()
  handleRemark?: string;
}

export class QueryStockAlertDto {
  @IsEnum(AlertType)
  @IsOptional()
  alertType?: AlertType;

  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsString()
  @IsOptional()
  productId?: string;
}

export class TriggerAlertCheckDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(AlertType)
  @IsOptional()
  alertType?: AlertType;
}
