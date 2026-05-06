import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'text', comment: '商品名称' })
  name: string;

  @Column({ nullable: true, name: 'category_id', comment: '商品分类ID' })
  categoryId: string;

  @Column({ nullable: true, comment: '商品编码' })
  code: string;

  @Column({ nullable: true, comment: '条形码' })
  barcode: string;

  @Column({ nullable: true, comment: '单位' })
  unit: string;

  @Column({ nullable: true, comment: '规格' })
  spec: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '销售价格' })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cost_price', comment: '成本价格' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '库存数量' })
  stock: number;

  @Column({ nullable: true, name: 'warehouse_id', comment: '默认仓库ID' })
  warehouseId: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '商品描述' })
  description: string;

  @Column({ type: 'text', nullable: true, comment: '商品图片' })
  images: string[];
}
