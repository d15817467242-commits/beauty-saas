import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { PermissionType } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: '权限名称不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '权限编码不能为空' })
  code: string;

  @IsEnum(PermissionType)
  @IsNotEmpty({ message: '权限类型不能为空' })
  permissionType: PermissionType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  apiPath?: string;

  @IsOptional()
  @IsString()
  apiMethod?: string;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsString()
  componentPath?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(PermissionType)
  permissionType?: PermissionType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  apiPath?: string;

  @IsOptional()
  @IsString()
  apiMethod?: string;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsString()
  componentPath?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
