import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Member } from '../../member/member.entity';

export enum CouponStatus {
  PENDING = 'pending',     // 待核销
  VERIFIED = 'verified',   // 已核销
  EXPIRED = 'expired',     // 已过期
  CANCELLED = 'cancelled', // 已取消
}

export enum CouponSource {
  MEITUAN = 'meituan',     // 美团
  DOUYIN = 'douyin',       // 抖音
  OTHER = 'other',         // 其他
}

@Entity('coupon_verifications')
export class CouponVerification extends BaseEntity {
  @Column({ name: 'coupon_code', unique: true, comment: '团购券码' })
  couponCode: string;

  @Column({ type: 'text',
    
    
    default: CouponSource.MEITUAN,
    name: 'coupon_source',
    comment: '券来源平台'})
  couponSource: CouponSource;

  @Column({ type: 'text', comment: '团购项目名称' })
  couponName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'coupon_value', comment: '券面值' })
  couponValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount', comment: '用户实付金额' })
  paidAmount: number;

  @Column({ type: 'text',
    
    
    default: CouponStatus.PENDING,
    comment: '核销状态'})
  status: CouponStatus;

  @Column({ nullable: true, name: 'member_id', comment: '关联会员ID' })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ nullable: true, type: 'datetime', name: 'verify_time', comment: '核销时间' })
  verifyTime: Date;

  @Column({ nullable: true, name: 'verify_by', comment: '核销人ID' })
  verifyBy: string;

  @Column({ nullable: true, name: 'consumption_id', comment: '关联消费记录ID' })
  consumptionId: string;

  @Column({ type: 'datetime', nullable: true, name: 'expire_time', comment: '券过期时间' })
  expireTime: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
