import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum ServiceCategory {
  HAIR = 'hair',         // 美发
  BEAUTY = 'beauty',     // 美容
  NAIL = 'nail',         // 美甲
  OTHER = 'other',       // 其他
}

@Entity('services')
export class Service extends BaseEntity {
  @Column({ type: 'text', comment: '服务名称' })
  name: string;

  @Column({ nullable: true, type: 'text', comment: '服务编码' })
  code: string;

  @Column({ type: 'text', default: ServiceCategory.HAIR, comment: '服务分类' })
  category: ServiceCategory;

  @Column({ nullable: true, name: 'category_id', type: 'text', comment: '分类ID(关联ServiceCategoryEntity)' })
  categoryId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '价格' })
  price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, comment: '会员价' })
  memberPrice: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, name: 'commission_rate', comment: '提成比例(%)' })
  commissionRate: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, name: 'fixed_commission', comment: '固定提成金额' })
  fixedCommission: number;

  @Column({ nullable: true, type: 'int', comment: '服务时长(分钟)' })
  duration: number;

  @Column({ nullable: true, type: 'text', comment: '详细描述' })
  description: string;

  @Column({ nullable: true, type: 'text', comment: '服务图片URL' })
  image: string;

  @Column({ nullable: true, type: 'text', comment: '服务须知/注意事项' })
  notice: string;

  @Column({ type: 'int', default: 1, name: 'is_active', comment: '是否启用' })
  isActive: boolean | number;

  @Column({ default: 0, type: 'int', comment: '排序权重' })
  sort: number;

  // 关联服务分类
  @ManyToOne(() => require('./service-category.entity').ServiceCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  categoryEntity: any;

  // 关联服务套餐项
  @OneToMany(() => require('./package-item.entity').PackageItem, (item: any) => item.service)
  packageItems: any[];
}
