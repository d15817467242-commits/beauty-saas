import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateWorkScheduleDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsDateString()
  @IsNotEmpty({ message: '排班日期不能为空' })
  scheduleDate: string;

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

export class UpdateWorkScheduleDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string;

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

export class BatchScheduleDto {
  @IsString({ each: true })
  @IsNotEmpty({ message: '员工ID列表不能为空' })
  employeeIds: string[];

  @IsDateString({}, { each: true })
  @IsNotEmpty({ message: '排班日期列表不能为空' })
  scheduleDates: string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CopyScheduleDto {
  @IsDateString()
  @IsNotEmpty({ message: '源开始日期不能为空' })
  sourceStartDate: string;

  @IsDateString()
  @IsNotEmpty({ message: '源结束日期不能为空' })
  sourceEndDate: string;

  @IsDateString()
  @IsNotEmpty({ message: '目标开始日期不能为空' })
  targetStartDate: string;

  @IsOptional()
  @IsString({ each: true })
  employeeIds?: string[];
}