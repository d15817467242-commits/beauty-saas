import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_groups')
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '用户组名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '用户组编码' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '权限列表' })
  permissions?: string[];

  @Column({ type: 'text', nullable: true, comment: '数据权限范围' })
  dataScope?: {
    type: 'all' | 'department' | 'self';
    departmentIds?: string[];
  };

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
