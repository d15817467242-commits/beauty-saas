import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TrainingStatus } from '../entities/training.entity';

export class EnrollTrainingDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsString()
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId: string;
}

export class BatchEnrollDto {
  @IsString({ each: true })
  @IsNotEmpty({ message: '员工ID列表不能为空' })
  employeeIds: string[];

  @IsString()
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId: string;
}

export class UpdateTrainingProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  progress?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @IsOptional()
  @IsEnum(TrainingStatus)
  status?: TrainingStatus;
}

export class CompleteTrainingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsString()
  certificateNo?: string;

  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class TrainingFeedbackDto {
  @IsInt()
  @Min(1)
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class TrainingQueryDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsEnum(TrainingStatus)
  status?: TrainingStatus;
}
