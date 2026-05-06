import { IsString, IsNotEmpty, IsOptional, Matches, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateShiftTemplateDto {
  @IsString()
  @IsNotEmpty({ message: '班次名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '上班时间格式不正确，应为HH:mm' })
  @IsNotEmpty({ message: '上班时间不能为空' })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '下班时间格式不正确，应为HH:mm' })
  @IsNotEmpty({ message: '下班时间不能为空' })
  endTime: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '休息开始时间格式不正确，应为HH:mm' })
  breakStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '休息结束时间格式不正确，应为HH:mm' })
  breakEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  workHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  graceMinutes?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateShiftTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '上班时间格式不正确，应为HH:mm' })
  startTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '下班时间格式不正确，应为HH:mm' })
  endTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '休息开始时间格式不正确，应为HH:mm' })
  breakStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '休息结束时间格式不正确，应为HH:mm' })
  breakEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  workHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  graceMinutes?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
