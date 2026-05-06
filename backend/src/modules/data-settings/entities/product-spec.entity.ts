import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_specs')
export class ProductSpec {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '规格名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '规格编码' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '规格值列表' })
  values?: string[];

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
