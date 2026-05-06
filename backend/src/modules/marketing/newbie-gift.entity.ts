import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('newbie_gifts')
export class NewbieGift extends BaseEntity {
  @Column({ type: 'text', comment: '礼包名称' })
  name: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'points_reward', default: 0, comment: '赠送积分' })
  pointsReward: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_reward', default: 0, comment: '赠送余额' })
  balanceReward: number;

  @Column({ nullable: true, type: 'text', name: 'coupon_ids', comment: '赠送优惠券ID列表' })
  couponIds: string[];

  @Column({ nullable: true, type: 'text', name: 'service_ids', comment: '赠送服务ID列表' })
  serviceIds: string[];

  @Column({ type: 'int', name: 'valid_days', default: 30, comment: '礼包有效期(天)' })
  validDays: number;

  @Column({ nullable: true, comment: '礼包说明' })
  description: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

@Entity('newbie_gift_records')
export class NewbieGiftRecord extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'newbie_gift_id', comment: '新人礼包ID' })
  newbieGiftId: string;

  @Column({ type: 'datetime', name: 'receive_time', comment: '领取时间' })
  receiveTime: Date;

  @Column({ type: 'datetime', name: 'expire_time', comment: '过期时间' })
  expireTime: Date;

  @Column({ type: 'text', default: false, comment: '是否已使用' })
  used: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'points_received', default: 0, comment: '已领取积分' })
  pointsReceived: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_received', default: 0, comment: '已领取余额' })
  balanceReceived: number;
}
