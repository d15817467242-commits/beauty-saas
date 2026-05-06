import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CommissionRuleDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionRate?: number; // 提成比例(%)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedCommission?: number; // 固定提成金额
}

export class TieredCommissionRuleDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate: number;
}

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: '员工姓名不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '工号不能为空' })
  employeeNo: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  // 提成设置
  @IsOptional()
  @IsEnum(['percent', 'fixed', 'tiered'])
  commissionType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseCommissionRate?: number; // 基础提成比例(%)

  @IsOptional()
  tieredCommissionRules?: TieredCommissionRuleDto[];

  @IsOptional()
  commissionRules?: CommissionRuleDto[];
}
