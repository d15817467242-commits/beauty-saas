import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../entities/attendance.entity';

export class CheckInDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsOptional()
  @IsString()
  checkInLocation?: string;

  @IsOptional()
  @IsString()
  checkInPhoto?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CheckOutDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsOptional()
  @IsString()
  checkOutLocation?: string;

  @IsOptional()
  @IsString()
  checkOutPhoto?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class AttendanceQueryDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsDateString()
  @IsNotEmpty({ message: '开始日期不能为空' })
  startDate: string;

  @IsDateString()
  @IsNotEmpty({ message: '结束日期不能为空' })
  endDate: string;
}

export class AttendanceStatsQueryDto {
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

export class UpdateAttendanceDto {
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  checkInStatus?: AttendanceStatus;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  checkOutStatus?: AttendanceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  workHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  penaltyAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimePay?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
