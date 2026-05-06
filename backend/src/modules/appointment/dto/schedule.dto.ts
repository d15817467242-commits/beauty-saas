import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(['work', 'rest', 'leave'])
  type?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsEnum(['work', 'rest', 'leave'])
  type?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchCreateScheduleDto {
  @IsNotEmpty()
  @IsString({ each: true })
  employeeIds: string[];

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(['work', 'rest', 'leave'])
  type?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString({ each: true })
  restDays?: string[]; // 休息日（周几，如 ['0', '6'] 表示周日和周六）
}

export class QueryScheduleDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
