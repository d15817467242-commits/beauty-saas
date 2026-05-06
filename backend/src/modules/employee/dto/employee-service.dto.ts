import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeServiceDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  serviceId: string;

  @IsString()
  serviceName: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateEmployeeServiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchAssignServiceDto {
  @IsUUID()
  employeeId: string;

  @IsUUID('4', { each: true })
  serviceIds: string[];
}

export class EmployeeServiceQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
