import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType } from '../operation-log.entity';

export { OperationType };

export class CreateOperationLogDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsEnum(OperationType)
  operationType: OperationType;

  @IsString()
  module: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsObject()
  result?: Record<string, any>;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsBoolean()
  isSuccess?: boolean;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;
}

export class QueryOperationLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsBoolean()
  isSuccess?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class BatchDeleteLogsDto {
  @IsString({ each: true })
  ids: string[];
}

export class CleanOldLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysToKeep?: number;
}

export class ExportLogsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsBoolean()
  isSuccess?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
