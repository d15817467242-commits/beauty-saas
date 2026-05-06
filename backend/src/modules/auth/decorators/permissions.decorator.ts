import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// 权限装饰器
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

// 常用权限装饰器快捷方式
export const RequireMemberView = () => RequirePermissions('member:view');
export const RequireMemberCreate = () => RequirePermissions('member:create');
export const RequireMemberUpdate = () => RequirePermissions('member:update');
export const RequireMemberDelete = () => RequirePermissions('member:delete');

export const RequireEmployeeView = () => RequirePermissions('employee:view');
export const RequireEmployeeCreate = () => RequirePermissions('employee:create');
export const RequireEmployeeUpdate = () => RequirePermissions('employee:update');
export const RequireEmployeeDelete = () => RequirePermissions('employee:delete');

export const RequireServiceView = () => RequirePermissions('service:view');
export const RequireServiceCreate = () => RequirePermissions('service:create');
export const RequireServiceUpdate = () => RequirePermissions('service:update');
export const RequireServiceDelete = () => RequirePermissions('service:delete');

export const RequireCountCardView = () => RequirePermissions('count_card:view');
export const RequireCountCardCreate = () => RequirePermissions('count_card:create');

export const RequireCashierUse = () => RequirePermissions('cashier:use');
export const RequireReportView = () => RequirePermissions('report:view');
