import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'text', comment: '角色名称' })
  name: string;

  @Column({ unique: true, comment: '角色编码' })
  code: string;

  @Column({ nullable: true, type: 'text', comment: '角色描述' })
  description: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ type: 'text', default: false, name: 'is_system', comment: '是否系统内置角色' })
  isSystem: boolean;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }})
  permissions: Permission[];
}
