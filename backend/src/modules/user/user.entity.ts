
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import { Role } from '../auth/role.entity';

export enum UserRole {
  ADMIN = 'admin',       // 管理员
  MANAGER = 'manager',   // 店长
  EMPLOYEE = 'employee', // 员工
  CASHIER = 'cashier',   // 收银员
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
    default: UserRole.EMPLOYEE,
    comment: '角色'})
  role: UserRole;

  @Column({ nullable: true, name: 'role_id', comment: '角色ID' })
  roleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  roleDetail: Role;

  // 修复：isActive 改成 text 类型，SQLite 兼容性更好
  @Column({ type: 'text', default: '1', comment: '是否启用' })
  isActive: any;
}
