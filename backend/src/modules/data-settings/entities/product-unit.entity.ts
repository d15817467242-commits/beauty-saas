import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_units')
export class ProductUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, comment: '单位名称' })
  name: string;

  @Column({ length: 20, unique: true, comment: '单位编码' })
  code: string;

  @Column({ length: 10, nullable: true, comment: '单位符号' })
  symbol?: string;

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
