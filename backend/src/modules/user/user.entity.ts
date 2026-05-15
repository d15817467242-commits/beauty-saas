
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import { Role } from '../auth/role.entity';

export enum UserRole {
  SUPERADMIN = 'superadmin', // 服务商（丁老大）
  ADMIN = 'admin',           // 连锁管理员/单店管理员
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, comment: '用户名' })
  username: string;

  @Column({ type: 'text', comment: '密码' })
  @Exclude()
  password: string;

  @Column({ type: 'text', comment: '真实姓名' })
  name: string;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '头像' })
  avatar: string;

  @Column({ type: 'text',
    default: UserRole.ADMIN,
    comment: '角色'})
  role: UserRole;

  @Column({ nullable: true, name: 'role_id', comment: '角色ID' })
  roleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  roleDetail: Role;

  @Column({ nullable: true, name: 'store_id', comment: '所属门店ID' })
  storeId: string;

  // 修复：isActive 改成 text 类型，SQLite 兼容性更好
  @Column({ type: 'text', default: '1', comment: '是否启用' })
  isActive: any;
}
