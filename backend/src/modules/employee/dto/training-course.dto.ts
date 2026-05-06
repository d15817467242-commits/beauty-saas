import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsArray, IsNumber, IsUrl } from 'class-validator';
import { CourseType, CourseStatus } from '../entities/training-course.entity';

export class CreateTrainingCourseDto {
  @IsString()
  @IsNotEmpty({ message: '课程名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsEnum(CourseType)
  @IsNotEmpty({ message: '课程类型不能为空' })
  courseType: CourseType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPositions?: string[];

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTrainingCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPositions?: string[];

  @IsOptional()
  @IsString()
  remark?: string;
}
