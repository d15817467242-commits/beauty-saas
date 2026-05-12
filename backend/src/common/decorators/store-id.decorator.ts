import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前操作的门店ID
 * 优先级：请求参数 > 请求体 > JWT用户信息
 * 超级管理员切换门店时，storeId 通过请求参数传递
 */
export const StoreId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    // 1. 优先从查询参数取
    const queryStoreId = request.query?.storeId;
    if (queryStoreId) return queryStoreId;
    // 2. 从请求体取
    const bodyStoreId = request.body?.storeId;
    if (bodyStoreId) return bodyStoreId;
    // 3. 从JWT用户信息取
    const userStoreId = request.user?.storeId;
    if (userStoreId) return userStoreId;
    return undefined;
  },
);
