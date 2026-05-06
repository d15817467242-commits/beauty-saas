import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('product_categories')
export class ProductCategory extends BaseEntity {
  @Column({ type: 'text', comment: '分类名称' })
  name: string;

  @Column({ nullable: true, name: 'category_code', unique: true, comment: '分类编码' })
  categoryCode: string;

  @Column({ nullable: true, comment: '分类描述' })
  description: string;

  @Column({ nullable: true, name: 'parent_id', comment: '父分类ID' })
  parentId: string;

  @Column({ type: 'int', default: 0, comment: '排序序号' })
  sort: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '图标' })
  icon: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
