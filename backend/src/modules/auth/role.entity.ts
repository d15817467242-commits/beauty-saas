
import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RoleCode {
  ADMIN = 'admin',           // 管理员
  MANAGER = 'manager',       // 店长
  RECEPTIONIST = 'receptionist', // 前台
  STYLIST = 'stylist',       // 发型师
}

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true, comment: '角色编码' })
  code: string;

  @Column({ type: 'text', comment: '角色名称' })
  name: string;

  @Column({ nullable: true, comment: '角色描述' })
  description: string;

  // 修复：permissions 改成 text 类型，SQLite 兼容性更好
  @Column({ type: 'text', nullable: true, comment: '权限列表' })
  permissions: any;

  // 修复：isActive 改成 text 类型
  @Column({ type: 'text', default: '1', name: 'is_active', comment: '是否启用' })
  isActive: any;
}

// 权限定义
export const Permissions = {
  // 会员管理
  MEMBER_VIEW: 'member:view',
  MEMBER_CREATE: 'member:create',
  MEMBER_UPDATE: 'member:update',
  MEMBER_DELETE: 'member:delete',
  
  // 员工管理
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  
  // 服务管理
  SERVICE_VIEW: 'service:view',
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',
  
  // 次卡管理
  COUNT_CARD_VIEW: 'count_card:view',
  COUNT_CARD_CREATE: 'count_card:create',
  COUNT_CARD_UPDATE: 'count_card:update',
  COUNT_CARD_DELETE: 'count_card:delete',
  
  // 收银台
  CASHIER_USE: 'cashier:use',
  
  // 报表
  REPORT_VIEW: 'report:view',
  
  // 系统设置
  SYSTEM_SETTINGS: 'system:settings'};

// 默认角色权限配置
export const DefaultRolePermissions: Record<RoleCode, string[]> = {
  [RoleCode.ADMIN]: Object.values(Permissions), // 管理员拥有所有权限
  [RoleCode.MANAGER]: [
    Permissions.MEMBER_VIEW, Permissions.MEMBER_CREATE, Permissions.MEMBER_UPDATE,
    Permissions.EMPLOYEE_VIEW,
    Permissions.SERVICE_VIEW, Permissions.SERVICE_UPDATE,
    Permissions.COUNT_CARD_VIEW, Permissions.COUNT_CARD_CREATE,
    Permissions.CASHIER_USE,
    Permissions.REPORT_VIEW,
  ],
  [RoleCode.RECEPTIONIST]: [
    Permissions.MEMBER_VIEW, Permissions.MEMBER_CREATE, Permissions.MEMBER_UPDATE,
    Permissions.SERVICE_VIEW,
    Permissions.COUNT_CARD_VIEW,
    Permissions.CASHIER_USE,
  ],
  [RoleCode.STYLIST]: [
    Permissions.MEMBER_VIEW,
    Permissions.SERVICE_VIEW,
  ]};
