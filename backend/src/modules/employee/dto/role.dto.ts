import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '角色编码不能为空' })
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty({ message: '员工ID不能为空' })
  employeeId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: '角色ID列表不能为空' })
  roleIds: string[];
}

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty({ message: '角色ID不能为空' })
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: '权限ID列表不能为空' })
  permissionIds: string[];
}
