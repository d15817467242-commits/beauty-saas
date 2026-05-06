import { IsString, IsNotEmpty, IsOptional, Matches, IsInt, Min, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceRuleDto {
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  name: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '标准上班时间格式不正确，应为HH:mm' })
  @IsNotEmpty({ message: '标准上班时间不能为空' })
  standardStart: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '标准下班时间格式不正确，应为HH:mm' })
  @IsNotEmpty({ message: '标准下班时间不能为空' })
  standardEnd: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  earlyLeaveThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absentThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earlyLeavePenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  absentPenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsString()
  workDays?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateAttendanceRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '标准上班时间格式不正确，应为HH:mm' })
  standardStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '标准下班时间格式不正确，应为HH:mm' })
  standardEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  earlyLeaveThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absentThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earlyLeavePenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  absentPenalty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsString()
  workDays?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}
