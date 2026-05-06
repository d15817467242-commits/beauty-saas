import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CouponType {
  DISCOUNT = 'discount',   // 折扣券
  CASH = 'cash',           // 代金券
  GIFT = 'gift',           // 赠品券
  SERVICE = 'service',     // 服务券
}

export enum CouponStatus {
  ACTIVE = 'active',       // 生效中
  INACTIVE = 'inactive',   // 已停用
  EXPIRED = 'expired',     // 已过期
}

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ type: 'text', comment: '优惠券名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: CouponType.CASH,
    comment: '优惠券类型'})
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '折扣金额/折扣率' })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_amount', default: 0, comment: '最低消费金额' })
  minAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'max_discount', nullable: true, comment: '最大优惠金额' })
  maxDiscount: number;

  @Column({ type: 'int', name: 'total_count', default: -1, comment: '发放总量(-1为无限)' })
  totalCount: number;

  @Column({ type: 'int', name: 'used_count', default: 0, comment: '已使用数量' })
  usedCount: number;

  @Column({ type: 'int', name: 'per_limit', default: 1, comment: '每人限领数量' })
  perLimit: number;

  @Column({ type: 'datetime', name: 'start_time', comment: '生效开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', comment: '生效结束时间' })
  endTime: Date;

  @Column({ type: 'text',
    
    
    default: CouponStatus.ACTIVE,
    comment: '状态'})
  status: CouponStatus;

  @Column({ nullable: true, type: 'text', name: 'applicable_services', comment: '适用服务ID列表' })
  applicableServices: string[];

  @Column({ nullable: true, type: 'text', name: 'applicable_products', comment: '适用产品ID列表' })
  applicableProducts: string[];

  @Column({ nullable: true, comment: '使用说明' })
  description: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

@Entity('member_coupons')
export class MemberCoupon extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'coupon_id', comment: '优惠券ID' })
  couponId: string;

  @Column({ type: 'datetime', name: 'receive_time', comment: '领取时间' })
  receiveTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'use_time', comment: '使用时间' })
  useTime: Date;

  @Column({ name: 'order_id', nullable: true, comment: '使用的订单ID' })
  orderId: string;

  @Column({ type: 'text', default: false, comment: '是否已使用' })
  used: boolean;

  @Column({ type: 'datetime', name: 'expire_time', comment: '过期时间' })
  expireTime: Date;
}
