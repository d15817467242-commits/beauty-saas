import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '部门名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '部门编码' })
  code: string;

  @Column({ nullable: true, comment: '上级部门ID' })
  parentId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Department;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

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
