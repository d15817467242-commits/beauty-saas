import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色权限守卫
 * 配合 @Roles() 装饰器使用
 * - superadmin 始终放行
 * - 未标注 @Roles() 的接口所有已登录用户可访问
 * - 标注 @Roles() 的接口只允许指定角色访问
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 未标注角色要求，放行
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // superadmin 始终放行
    if (user.role === 'superadmin') return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('无权执行此操作');
    }

    return true;
  }
}
