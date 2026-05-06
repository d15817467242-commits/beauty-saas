import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';

export enum ReferralStatus {
  PENDING = 'pending',     // 待完成
  COMPLETED = 'completed', // 已完成
  REWARDED = 'rewarded',   // 已发放奖励
}

@Entity('referrals')
export class Referral extends BaseEntity {
  @Column({ name: 'referrer_id', comment: '推荐人会员ID' })
  referrerId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'referrer_id' })
  referrer: Member;

  @Column({ name: 'referee_id', comment: '被推荐人会员ID' })
  refereeId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'referee_id' })
  referee: Member;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'referee_first_spend', nullable: true, comment: '被推荐人首消费金额' })
  refereeFirstSpend: number;

  @Column({ type: 'text',
    
    
    default: ReferralStatus.PENDING,
    comment: '状态'})
  status: ReferralStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'referrer_reward', default: 0, comment: '推荐人奖励金额' })
  referrerReward: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'referee_reward', default: 0, comment: '被推荐人奖励金额' })
  refereeReward: number;

  @Column({ type: 'datetime', name: 'referral_time', comment: '推荐时间' })
  referralTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'complete_time', comment: '完成时间' })
  completeTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'reward_time', comment: '奖励发放时间' })
  rewardTime: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

@Entity('referral_configs')
export class ReferralConfig extends BaseEntity {
  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'referrer_reward', default: 0, comment: '推荐人奖励金额' })
  referrerReward: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'referee_reward', default: 0, comment: '被推荐人奖励金额' })
  refereeReward: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_spend', default: 0, comment: '最低消费金额要求' })
  minSpend: number;

  @Column({ type: 'int', name: 'valid_days', default: 30, comment: '有效期(天)' })
  validDays: number;

  @Column({ nullable: true, comment: '活动说明' })
  description: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
