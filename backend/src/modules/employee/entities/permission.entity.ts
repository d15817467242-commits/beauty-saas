import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum PermissionType {
  MENU = 'menu',           // 菜单权限
  BUTTON = 'button',       // 按钮权限
  API = 'api',             // API权限
  DATA = 'data',           // 数据权限
}

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'text', comment: '权限名称' })
  name: string;

  @Column({ unique: true, comment: '权限编码' })
  code: string;

  @Column({   name: 'permission_type', comment: '权限类型' })
  permissionType: PermissionType;

  @Column({ name: 'parent_id', nullable: true, comment: '父级权限ID' })
  parentId: string;

  @Column({ type: 'int', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ nullable: true, comment: '图标' })
  icon: string;

  @Column({ nullable: true, name: 'api_path', comment: 'API路径' })
  apiPath: string;

  @Column({ nullable: true, name: 'api_method', comment: 'API方法' })
  apiMethod: string;

  @Column({ nullable: true, name: 'route_path', comment: '前端路由路径' })
  routePath: string;

  @Column({ nullable: true, name: 'component_path', comment: '组件路径' })
  componentPath: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, type: 'text', comment: '描述' })
  description: string;
}
