import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Coupon, MemberCoupon } from './coupon.entity';

export enum UsageType {
  USE = 'use',           // 使用
  REFUND = 'refund',     // 退款返还
  EXPIRE = 'expire',     // 过期
  CANCEL = 'cancel',     // 取消
}

@Entity('coupon_usages')
@Index('idx_coupon_usages_coupon_id', ['couponId'])
@Index('idx_coupon_usages_member_id', ['memberId'])
@Index('idx_coupon_usages_usage_time', ['usageTime'])
export class CouponUsage extends BaseEntity {
  @Column({ name: 'coupon_id', comment: '优惠券ID' })
  couponId: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'member_coupon_id', comment: '会员优惠券ID' })
  memberCouponId: string;

  @ManyToOne(() => MemberCoupon)
  @JoinColumn({ name: 'member_coupon_id' })
  memberCoupon: MemberCoupon;

  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'order_id', nullable: true, comment: '订单ID' })
  orderId: string;

  @Column({ type: 'text',
    
    
    default: UsageType.USE,
    comment: '使用类型'})
  type: UsageType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount', default: 0, comment: '优惠金额' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'order_amount', default: 0, comment: '订单金额' })
  orderAmount: number;

  @Column({ type: 'datetime', name: 'usage_time', comment: '使用时间' })
  usageTime: Date;

  @Column({ name: 'store_id', nullable: true, comment: '使用门店ID' })
  storeId: string;

  @Column({ name: 'staff_id', nullable: true, comment: '操作员工ID' })
  staffId: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ nullable: true, type: 'text', comment: '额外信息' })
  extraInfo: Record<string, any>;
}

@Entity('coupon_statistics')
export class CouponStatistics extends BaseEntity {
  @Column({ name: 'coupon_id', comment: '优惠券ID' })
  couponId: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ type: 'date', name: 'stat_date', comment: '统计日期' })
  statDate: Date;

  @Column({ type: 'int', name: 'receive_count', default: 0, comment: '领取数量' })
  receiveCount: number;

  @Column({ type: 'int', name: 'use_count', default: 0, comment: '使用数量' })
  useCount: number;

  @Column({ type: 'int', name: 'expire_count', default: 0, comment: '过期数量' })
  expireCount: number;

  @Column({ type: 'int', name: 'refund_count', default: 0, comment: '退款返还数量' })
  refundCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_discount', default: 0, comment: '总优惠金额' })
  totalDiscount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_order_amount', default: 0, comment: '总订单金额' })
  totalOrderAmount: number;

  @Column({ type: 'int', name: 'new_member_count', default: 0, comment: '新会员使用数' })
  newMemberCount: number;

  @Column({ type: 'int', name: 'old_member_count', default: 0, comment: '老会员使用数' })
  oldMemberCount: number;
}
