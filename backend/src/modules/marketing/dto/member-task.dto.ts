import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType, TaskAction, TaskStatus, RewardType, TaskRecordStatus } from '../member-task.entity';

export class CreateMemberTaskDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsEnum(TaskAction)
  action: TaskAction;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  targetCount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxProgress?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsObject()
  @IsOptional()
  actionConfig?: {
    minAmount?: number;
    serviceIds?: string[];
    productIds?: string[];
    continuousDays?: number;
    totalAmount?: number;
    platform?: string;
  };

  @IsObject()
  @IsOptional()
  targetConditions?: {
    memberLevels?: string[];
    tags?: string[];
    newMember?: boolean;
  };

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;
}

export class UpdateMemberTaskDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskAction)
  @IsOptional()
  action?: TaskAction;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  targetCount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxProgress?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsObject()
  @IsOptional()
  actionConfig?: any;

  @IsObject()
  @IsOptional()
  targetConditions?: any;
}

export class CreateTaskRewardDto {
  @IsString()
  taskId: string;

  @IsEnum(RewardType)
  type: RewardType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rewardValue: number;

  @IsString()
  @IsOptional()
  rewardId?: string;

  @IsString()
  @IsOptional()
  rewardName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  rewardQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  probability?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxCount?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateTaskRewardDto {
  @IsEnum(RewardType)
  @IsOptional()
  type?: RewardType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rewardValue?: number;

  @IsString()
  @IsOptional()
  rewardId?: string;

  @IsString()
  @IsOptional()
  rewardName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  rewardQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  probability?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxCount?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class CompleteTaskDto {
  @IsString()
  taskId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  progress?: number;

  @IsObject()
  @IsOptional()
  extraInfo?: Record<string, any>;
}

export class ClaimRewardDto {
  @IsString()
  recordId: string;
}

export class TaskQueryDto {
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskAction)
  @IsOptional()
  action?: TaskAction;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class TaskStatisticsQueryDto {
  @IsString()
  taskId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
