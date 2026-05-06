import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DiscountValueType {
  PERCENTAGE = 'percentage', // 百分比折扣
  FIXED = 'fixed',           // 固定金额折扣
}

export enum DiscountScope {
  ALL = 'all',               // 全场通用
  SERVICE = 'service',       // 指定服务
  PRODUCT = 'product',       // 指定商品
  CATEGORY = 'category',     // 指定分类
}

@Entity('discounts')
export class Discount extends BaseEntity {
  @Column({ type: 'text', comment: '折扣名称' })
  name: string;

  @Column({ nullable: true, name: 'discount_code', unique: true, comment: '折扣码' })
  discountCode: string;

  @Column({ type: 'text',
    
    
    default: DiscountValueType.PERCENTAGE,
    name: 'discount_type',
    comment: '折扣类型'})
  discountType: DiscountValueType;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    comment: '折扣值(百分比或固定金额)' 
  })
  discountValue: number;

  @Column({ type: 'text',
    
    
    default: DiscountScope.ALL,
    name: 'discount_scope',
    comment: '适用范围'})
  discountScope: DiscountScope;

  @Column({ nullable: true, type: 'text', name: 'scope_ids', comment: '适用范围ID列表(服务/商品/分类ID)' })
  scopeIds: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_amount', comment: '最低消费金额' })
  minAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'max_discount', comment: '最大优惠金额' })
  maxDiscount: number;

  @Column({ type: 'datetime', nullable: true, name: 'start_time', comment: '生效开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time', comment: '生效结束时间' })
  endTime: Date;

  @Column({ type: 'int', default: 0, name: 'usage_limit', comment: '使用次数限制(0为不限)' })
  usageLimit: number;

  @Column({ type: 'int', default: 0, name: 'used_count', comment: '已使用次数' })
  usedCount: number;

  @Column({ type: 'int', default: 1, name: 'per_user_limit', comment: '每用户限用次数' })
  perUserLimit: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
