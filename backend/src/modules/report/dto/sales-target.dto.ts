import { IsOptional, IsDateString, IsNumber, Min, IsEnum, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetPeriod } from '../entities/sales-target.entity';

export class CreateSalesTargetDto {
  @IsString()
  name: string;

  @IsEnum(TargetPeriod)
  periodType: TargetPeriod;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSalesTargetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TargetPeriod)
  periodType?: TargetPeriod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class SalesTargetQueryDto {
  @IsOptional()
  @IsEnum(TargetPeriod)
  periodType?: TargetPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class RevenueSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

export class BusinessOverviewQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class EmployeePerformanceQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class ServiceAnalysisQueryDto {
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
  limit?: number;

  @IsOptional()
  @IsEnum(['sales', 'revenue'])
  sortBy?: 'sales' | 'revenue';
}

export class MemberAnalysisQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

export class TimeAnalysisQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['hour', 'day', 'week'])
  groupBy?: 'hour' | 'day' | 'week';
}
