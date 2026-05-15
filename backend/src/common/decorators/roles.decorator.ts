import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 设置接口所需角色
 * 用法: @Roles('admin', 'manager')
 * 不加此装饰器则所有已登录用户均可访问
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
