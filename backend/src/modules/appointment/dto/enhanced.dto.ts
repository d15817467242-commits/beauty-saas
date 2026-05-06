import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsBoolean, IsArray, IsDateString } from 'class-validator';

// ========== 预约提醒 DTO ==========

export class CreateReminderDto {
  @IsNotEmpty()
  @IsString()
  appointmentId: string;

  @IsNotEmpty()
  @IsEnum(['sms', 'wechat', 'both'])
  reminderType: string;

  @IsNotEmpty()
  @IsEnum(['1440', '120', '60', '30', '0'])
  timingType: string;

  @IsOptional()
  @IsInt()
  timingMinutes?: number;

  @IsOptional()
  @IsString()
  content?: string;
}

export class QueryReminderDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(['pending', 'sent', 'failed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SendReminderDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

// ========== 排队 DTO ==========

export class CreateQueueDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @IsOptional()
  @IsDateString()
  queueDate?: string;
}

export class UpdateQueueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'paused', 'closed'])
  status?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;
}

export class QueryQueueDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsEnum(['active', 'paused', 'closed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

// 排队取号
export class TakeQueueNumberDto {
  @IsNotEmpty()
  @IsString()
  queueId: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

// 叫号
export class CallQueueNumberDto {
  @IsNotEmpty()
  @IsString()
  queueId: string;
}

// 更新排队项状态
export class UpdateQueueItemDto {
  @IsNotEmpty()
  @IsEnum(['waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show'])
  status: string;
}

export class QueryQueueItemDto {
  @IsOptional()
  @IsString()
  queueId?: string;

  @IsOptional()
  @IsEnum(['waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show'])
  status?: string;

  @IsOptional()
  @IsString()
  memberId?: string;
}

// ========== 评价 DTO ==========

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  appointmentId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  environmentRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  attitudeRating?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  environmentRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  attitudeRating?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class ReplyReviewDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class QueryReviewDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ========== 日历视图 DTO ==========

export class CalendarQueryDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  view?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

// ========== 冲突检测 DTO ==========

export class CheckConflictDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsDateString()
  appointmentDate: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  excludeId?: string;
}
