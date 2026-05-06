import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ScheduleStatus } from '../entities/work-schedule.entity';

export class CreateWorkScheduleDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsDateString()
  @IsNotEmpty({ message: '排班日期不能为空' })
  scheduleDate: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateWorkScheduleDto {
  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsString()
  actualStart?: string;

  @IsOptional()
  @IsString()
  actualEnd?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchScheduleDto {
  @IsString({ each: true })
  @IsNotEmpty({ message: '员工ID列表不能为空' })
  employeeIds: string[];

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsDateString({}, { each: true })
  @IsNotEmpty({ message: '排班日期列表不能为空' })
  scheduleDates: string[];

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
