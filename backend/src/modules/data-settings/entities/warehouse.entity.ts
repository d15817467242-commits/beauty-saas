import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '仓库名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '仓库编码' })
  code: string;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @Column({ type: 'text', nullable: true, comment: '仓库地址' })
  address?: string;

  @Column({ length: 20, nullable: true, comment: '联系人' })
  contact?: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  phone?: string;

  @Column({ type: 'text', default: false, comment: '是否默认仓库' })
  isDefault: boolean;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
