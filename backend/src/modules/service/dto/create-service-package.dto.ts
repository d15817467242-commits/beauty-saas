import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PackageStatus } from '../service-package.entity';

export class CreateServicePackageDto {
  @IsString()
  @IsNotEmpty({ message: '套餐名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Type(() => Number)
  @IsNumber()
  originalPrice: number;

  @Type(() => Number)
  @IsNumber()
  packagePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  memberPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  validDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  startTime?: Date;

  @IsOptional()
  endTime?: Date;

  // 套餐项目列表
  @IsOptional()
  items?: CreatePackageItemDto[];
}

export class CreatePackageItemDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  overridePrice?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;
}
