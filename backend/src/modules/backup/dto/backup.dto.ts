import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum, IsArray, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BackupType, BackupFormat, BackupStatus } from '../backup.entity';

export { BackupType, BackupFormat, BackupStatus };

export class CreateBackupConfigDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsEnum(BackupFormat)
  format?: BackupFormat;

  @IsOptional()
  @IsBoolean()
  isAuto?: boolean;

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  retentionDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxBackups?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeTables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeTables?: string[];

  @IsOptional()
  @IsString()
  storagePath?: string;

  @IsOptional()
  @IsString()
  notifyEmail?: string;

  @IsOptional()
  @IsBoolean()
  notifyOnSuccess?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnFailure?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class UpdateBackupConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsEnum(BackupFormat)
  format?: BackupFormat;

  @IsOptional()
  @IsBoolean()
  isAuto?: boolean;

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  retentionDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxBackups?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeTables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeTables?: string[];

  @IsOptional()
  @IsString()
  storagePath?: string;

  @IsOptional()
  @IsString()
  notifyEmail?: string;

  @IsOptional()
  @IsBoolean()
  notifyOnSuccess?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnFailure?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class QueryBackupRecordDto {
  @IsOptional()
  @IsString()
  configId?: string;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsEnum(BackupStatus)
  status?: BackupStatus;

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

export class ExecuteBackupDto {
  @IsOptional()
  @IsString()
  configId?: string;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsEnum(BackupFormat)
  format?: BackupFormat;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tables?: string[];

  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

export class RestoreBackupDto {
  @IsOptional()
  @IsString()
  restoredBy?: string;
}

export class ToggleBackupConfigDto {
  @IsBoolean()
  isActive: boolean;
}

export class CleanOldBackupsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysToKeep?: number;
}
