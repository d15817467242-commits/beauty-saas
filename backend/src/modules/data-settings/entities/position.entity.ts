import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '职位名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '职位编码' })
  code: string;

  @Column({ nullable: true, comment: '部门ID' })
  departmentId?: string;

  @ManyToOne(() => require('./department.entity').Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: any;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '基本工资' })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '提成比例(%)' })
  commissionRate: number;

  @Column({ type: 'text', nullable: true, comment: '权限列表' })
  permissions?: string[];

  @Column({ type: 'text', nullable: true, comment: '职位描述' })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
