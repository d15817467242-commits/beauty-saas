import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionSource, CommissionStatus } from '../entities/commission-record.entity';

export class CreateCommissionRecordDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsEnum(CommissionSource)
  @IsNotEmpty({ message: '来源类型不能为空' })
  sourceType: CommissionSource;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  sourceNo?: string;

  @IsOptional()
  @IsString()
  sourceName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: '基础金额不能为空' })
  baseAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: '提成金额不能为空' })
  amount: number;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateCommissionRecordDto {
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CommissionQueryDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsEnum(CommissionSource)
  sourceType?: CommissionSource;
}

export class CommissionStatsQueryDto {
  @IsDateString()
  @IsNotEmpty({ message: '开始日期不能为空' })
  startDate: string;

  @IsDateString()
  @IsNotEmpty({ message: '结束日期不能为空' })
  endDate: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class ApproveCommissionDto {
  @IsString({ each: true })
  @IsNotEmpty({ message: '提成记录ID列表不能为空' })
  recordIds: string[];
}

export class PayCommissionDto {
  @IsString({ each: true })
  @IsNotEmpty({ message: '提成记录ID列表不能为空' })
  recordIds: string[];
}

export class CalculateCommissionDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsEnum(CommissionSource)
  @IsNotEmpty({ message: '来源类型不能为空' })
  sourceType: CommissionSource;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: '基础金额不能为空' })
  baseAmount: number;
}
